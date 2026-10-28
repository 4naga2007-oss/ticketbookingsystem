import { BookingRepository } from '../repositories/BookingRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { PassengerRepository } from '../repositories/PassengerRepository';
import { SeatAvailabilityService } from './SeatAvailabilityService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { Booking, PassengerDetail } from '../types/domain';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { db } from '../config/database';

export class BookingService {
  private bookingRepo: BookingRepository;
  private scheduleRepo: ScheduleRepository;
  private passengerRepo: PassengerRepository;
  private paymentRepo: PaymentRepository;
  private seatService: SeatAvailabilityService;

  constructor() {
    this.bookingRepo = new BookingRepository();
    this.scheduleRepo = new ScheduleRepository();
    this.passengerRepo = new PassengerRepository();
    this.paymentRepo = new PaymentRepository();
    this.seatService = new SeatAvailabilityService();
  }

  public createBooking(data: {
    passengerId: number;
    scheduleId: number;
    passengerDetails: PassengerDetail[];
  }): Booking {
    const { passengerId, scheduleId, passengerDetails } = data;

    // Clean up any stale holds first
    this.cleanupExpiredHolds(10);

    if (!passengerDetails || passengerDetails.length === 0) {
      throw new BadRequestError('Booking must include at least one passenger detail');
    }

    const passenger = this.passengerRepo.findById(passengerId);
    if (!passenger) {
      throw new NotFoundError(`Passenger ID ${passengerId} not found`);
    }

    const schedule = this.scheduleRepo.findWithDetails(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule ID ${scheduleId} not found`);
    }

    if (schedule.status !== 'Active') {
      throw new BadRequestError(`Schedule is currently ${schedule.status}`);
    }

    const requestedSeats = passengerDetails.map((p) => p.seatNumber);

    // Database transaction to atomically check and create booking in INITIATED status
    const transaction = db.transaction(() => {
      // 1. Check if seats need to be auto-allocated (IRCTC style for Train or unspecified seats)
      const isTrain = schedule.vehicleType === 'Train';
      const hasUnassignedSeats = passengerDetails.some((p) => !p.seatNumber || p.seatNumber === 'AUTO');

      let assignedDetails = [...passengerDetails];

      if (isTrain || hasUnassignedSeats) {
        // Fetch currently reserved seats in this transaction
        const currentlyReserved = this.bookingRepo.findReservedSeatsBySchedule(scheduleId);
        const prefix = isTrain ? 'T' : 'B';
        const availablePool: string[] = [];

        for (let i = 1; i <= schedule.totalSeats; i++) {
          const seatNo = `${prefix}${i < 10 ? '0' + i : i}`;
          if (!currentlyReserved.includes(seatNo)) {
            availablePool.push(seatNo);
          }
        }

        if (availablePool.length < passengerDetails.length) {
          throw new ConflictError(`Only ${availablePool.length} seats available. Cannot allot ${passengerDetails.length} seats.`);
        }

        // Shuffle / pick available seats
        assignedDetails = passengerDetails.map((p, index) => {
          const autoSeat = availablePool[index];
          return {
            ...p,
            seatNumber: (p.seatNumber && p.seatNumber !== 'AUTO') ? p.seatNumber : autoSeat,
            fare: schedule.fare,
          };
        });
      } else {
        // Validate specifically requested seats (Bus selection)
        this.seatService.validateAndLockSeats(scheduleId, requestedSeats);
      }

      // 2. Set fare per passenger based on schedule base fare
      const finalizedDetails: PassengerDetail[] = assignedDetails.map((p) => ({
        ...p,
        fare: schedule.fare,
      }));

      // 3. Create booking with INITIATED status
      const booking = this.bookingRepo.create(passengerId, scheduleId, finalizedDetails, 'INITIATED');
      return booking;
    });

    return transaction();
  }

  public getBookingById(bookingId: number, requestingPassengerId?: number): Booking {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (requestingPassengerId && booking.passengerId !== requestingPassengerId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return booking;
  }

  public getPassengerBookings(passengerId: number): Booking[] {
    return this.bookingRepo.findByPassengerId(passengerId);
  }

  public getAllBookings(): any[] {
    return this.bookingRepo.findAllWithDetails();
  }

  public modifyBooking(bookingId: number, updatedPassengerDetails: PassengerDetail[]): Booking {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestError('Cannot modify a cancelled booking');
    }

    db.prepare('UPDATE bookings SET passenger_details = ? WHERE booking_id = ?').run(
      JSON.stringify(updatedPassengerDetails),
      bookingId
    );

    return this.bookingRepo.findById(bookingId)!;
  }

  public cancelBooking(bookingId: number, requestingPassengerId?: number): { success: boolean; message: string } {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (requestingPassengerId && booking.passengerId !== requestingPassengerId) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestError('Booking is already cancelled');
    }

    const transaction = db.transaction(() => {
      // 1. Set status to CANCELLED
      this.bookingRepo.updateStatus(bookingId, 'CANCELLED');

      // 2. Release seat count back to vehicle inventory
      this.seatService.releaseSeatsOnCancellation(booking.scheduleId, booking.passengerDetails.length);
    });

    transaction();

    return {
      success: true,
      message: 'Booking cancelled successfully and seats released',
    };
  }

  /**
   * Cleanup expired temporary holds where bookingStatus is INITIATED and hold window has elapsed
   */
  public cleanupExpiredHolds(expiryMinutes: number = 10): { expiredCount: number; releasedBookingIds: number[] } {
    const rows = db.prepare(`
      SELECT booking_id as bookingId, schedule_id as scheduleId, passenger_details as passengerDetailsJson
      FROM bookings
      WHERE booking_status = 'INITIATED'
        AND datetime(booking_date) <= datetime('now', '-' || ? || ' minutes')
    `).all(expiryMinutes) as any[];

    const releasedBookingIds: number[] = [];

    if (rows.length > 0) {
      const transaction = db.transaction(() => {
        for (const r of rows) {
          this.bookingRepo.updateStatus(r.bookingId, 'CANCELLED');
          const details: PassengerDetail[] = JSON.parse(r.passengerDetailsJson);
          this.seatService.releaseSeatsOnCancellation(r.scheduleId, details.length);
          releasedBookingIds.push(r.bookingId);
        }
      });
      transaction();
    }

    return {
      expiredCount: releasedBookingIds.length,
      releasedBookingIds,
    };
  }
}
