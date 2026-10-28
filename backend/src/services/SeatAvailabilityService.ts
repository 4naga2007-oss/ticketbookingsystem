import { BookingRepository } from '../repositories/BookingRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { TrainRepository } from '../repositories/TrainRepository';
import { BusRepository } from '../repositories/BusRepository';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { db } from '../config/database';

export interface SeatMapStatus {
  seatNumber: string;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'OCCUPIED';
}

export class SeatAvailabilityService {
  private bookingRepo: BookingRepository;
  private scheduleRepo: ScheduleRepository;
  private trainRepo: TrainRepository;
  private busRepo: BusRepository;

  constructor() {
    this.bookingRepo = new BookingRepository();
    this.scheduleRepo = new ScheduleRepository();
    this.trainRepo = new TrainRepository();
    this.busRepo = new BusRepository();
  }

  public getSeatAvailability(scheduleId: number): {
    scheduleId: number;
    vehicleType: 'Train' | 'Bus';
    vehicleNameOrType: string;
    fare: number;
    totalSeats: number;
    availableSeats: number;
    occupiedSeats: string[];
    allSeats: string[];
    // backward-compat aliases
    reservedSeatNumbers: string[];
    seatMap: SeatMapStatus[];
  } {
    // 1. Auto-cleanup any stale holds older than 10 minutes
    this.cleanupStaleHolds(10);

    const schedule = this.scheduleRepo.findWithDetails(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule ${scheduleId} not found`);
    }

    const reservedSeatNumbers = this.bookingRepo.findReservedSeatsBySchedule(scheduleId);
    const totalSeats = schedule.totalSeats;
    const availableSeats = Math.max(0, totalSeats - reservedSeatNumbers.length);

    // Generate standard seat matrix based on vehicle type
    const prefix = schedule.vehicleType === 'Train' ? 'T' : 'B';
    const seatMap: SeatMapStatus[] = [];
    const allSeats: string[] = [];

    for (let i = 1; i <= totalSeats; i++) {
      const seatNo = `${prefix}${i < 10 ? '0' + i : i}`;
      const isReserved = reservedSeatNumbers.includes(seatNo);
      allSeats.push(seatNo);
      seatMap.push({
        seatNumber: seatNo,
        isAvailable: !isReserved,
        status: isReserved ? 'OCCUPIED' : 'AVAILABLE',
      });
    }

    return {
      scheduleId,
      vehicleType: schedule.vehicleType,
      vehicleNameOrType: schedule.vehicleNameOrType,
      fare: schedule.fare,
      totalSeats,
      availableSeats,
      occupiedSeats: reservedSeatNumbers,
      allSeats,
      // backward-compat
      reservedSeatNumbers,
      seatMap,
    };
  }

  public validateAndLockSeats(scheduleId: number, requestedSeatNumbers: string[]): boolean {
    // Auto-cleanup stale holds first
    this.cleanupStaleHolds(10);

    if (!requestedSeatNumbers || requestedSeatNumbers.length === 0) {
      throw new BadRequestError('At least one seat number must be specified');
    }

    const schedule = this.scheduleRepo.findWithDetails(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Schedule ${scheduleId} not found`);
    }

    const currentlyReserved = this.bookingRepo.findReservedSeatsBySchedule(scheduleId);

    for (const seatNo of requestedSeatNumbers) {
      if (currentlyReserved.includes(seatNo)) {
        throw new ConflictError(`Seat ${seatNo} is already booked or currently on hold. Please choose another seat.`);
      }
    }

    return true;
  }

  public releaseSeatsOnCancellation(scheduleId: number, seatCount: number): void {
    const schedule = this.scheduleRepo.findById(scheduleId);
    if (!schedule) return;

    if (schedule.trainId) {
      this.trainRepo.releaseSeat(schedule.trainId, seatCount);
    } else if (schedule.busId) {
      this.busRepo.releaseSeat(schedule.busId, seatCount);
    }
  }

  /**
   * Cancel all INITIATED bookings whose hold window has elapsed and restore
   * the vehicle's available_seats counter for each one.
   *
   * Safety: the WHERE clause filters on booking_status = 'INITIATED', so any
   * booking already cancelled by BookingService.cleanupExpiredHolds() (PATH 2)
   * will not be matched here — making double-release impossible.
   */
  private cleanupStaleHolds(expiryMinutes: number): void {
    // 1. Fetch all expired INITIATED holds with their schedule and passenger count
    const expired = db.prepare(`
      SELECT booking_id    AS bookingId,
             schedule_id   AS scheduleId,
             passenger_details AS passengerDetailsJson
      FROM bookings
      WHERE booking_status = 'INITIATED'
        AND datetime(booking_date) <= datetime('now', '-' || ? || ' minutes')
    `).all(expiryMinutes) as { bookingId: number; scheduleId: number; passengerDetailsJson: string }[];

    if (expired.length === 0) return;

    // 2. Cancel each expired hold and restore the vehicle seat inventory
    const transaction = db.transaction(() => {
      for (const row of expired) {
        // Cancel the booking
        db.prepare(`UPDATE bookings SET booking_status = 'CANCELLED' WHERE booking_id = ?`).run(row.bookingId);

        // Determine the number of seats to release from the passenger_details JSON
        let seatCount = 1;
        try {
          const details = JSON.parse(row.passengerDetailsJson);
          if (Array.isArray(details)) seatCount = details.length;
        } catch {
          // fallback: release 1 seat if JSON is malformed
        }

        // Restore the vehicle's available_seats counter (reuses existing method)
        this.releaseSeatsOnCancellation(row.scheduleId, seatCount);
      }
    });

    transaction();
  }
}
