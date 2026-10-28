import { PaymentRepository } from '../repositories/PaymentRepository';
import { BookingRepository } from '../repositories/BookingRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { PassengerRepository } from '../repositories/PassengerRepository';
import { ReceiptRepository } from '../repositories/ReceiptRepository';
import { TrainRepository } from '../repositories/TrainRepository';
import { BusRepository } from '../repositories/BusRepository';
import { PaymentGatewayAdapter } from '../adapters/PaymentGatewayAdapter';
import { NotificationServiceAdapter } from '../adapters/NotificationServiceAdapter';
import { Payment, CardPayment, UPIPayment, Receipt } from '../types/domain';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { db } from '../config/database';

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private bookingRepo: BookingRepository;
  private scheduleRepo: ScheduleRepository;
  private passengerRepo: PassengerRepository;
  private receiptRepo: ReceiptRepository;
  private trainRepo: TrainRepository;
  private busRepo: BusRepository;
  private gatewayAdapter: PaymentGatewayAdapter;
  private notificationAdapter: NotificationServiceAdapter;

  constructor() {
    this.paymentRepo = new PaymentRepository();
    this.bookingRepo = new BookingRepository();
    this.scheduleRepo = new ScheduleRepository();
    this.passengerRepo = new PassengerRepository();
    this.receiptRepo = new ReceiptRepository();
    this.trainRepo = new TrainRepository();
    this.busRepo = new BusRepository();
    this.gatewayAdapter = new PaymentGatewayAdapter();
    this.notificationAdapter = new NotificationServiceAdapter();
  }

  public async processCardPayment(data: {
    bookingId: number;
    amount: number;
    cardNumber: string;
    cardType: string;
    bankName: string;
    expiry: string;
  }): Promise<{ payment: CardPayment; receipt: Receipt }> {
    const { bookingId, amount, cardNumber, cardType, bankName, expiry } = data;

    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (booking.bookingStatus === 'CONFIRMED') {
      throw new ConflictError('This booking has already been paid for and confirmed');
    }
    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestError('Cannot process payment for a cancelled booking');
    }

    // Call Mock Gateway Adapter
    const gatewayRes = await this.gatewayAdapter.processCardPayment({
      cardNumber,
      cardType,
      bankName,
      expiry,
      amount,
    });

    if (!gatewayRes.success) {
      this.paymentRepo.createCardPayment(bookingId, amount, cardNumber, cardType, bankName, 'FAILED');
      throw new BadRequestError(`Payment failed: ${gatewayRes.message}`);
    }

    // Atomic confirmation transaction
    const schedule = this.scheduleRepo.findWithDetails(booking.scheduleId)!;
    const passenger = this.passengerRepo.findById(booking.passengerId)!;

    const result = db.transaction(() => {
      // 1. Create completed card payment record (storing only masked card details)
      const payment = this.paymentRepo.createCardPayment(bookingId, amount, cardNumber, cardType, bankName, 'SUCCESS');

      // 2. Transition booking to CONFIRMED
      this.bookingRepo.updateStatus(bookingId, 'CONFIRMED');

      // 3. Decrement available seats in vehicle inventory
      if (schedule.trainId) {
        for (let i = 0; i < booking.passengerDetails.length; i++) {
          this.trainRepo.reserveSeat(booking.scheduleId, booking.passengerDetails[i].seatNumber);
        }
      } else if (schedule.busId) {
        for (let i = 0; i < booking.passengerDetails.length; i++) {
          this.busRepo.reserveSeat(booking.scheduleId, booking.passengerDetails[i].seatNumber);
        }
      }

      // 4. Generate Receipt
      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const receipt = this.receiptRepo.create(bookingId, ticketNumber, new Date().toISOString().split('T')[0], {
        passengerName: passenger.name,
        routeSource: schedule.route.source,
        routeDestination: schedule.route.destination,
        vehicleType: schedule.vehicleType,
        vehicleNameOrType: schedule.vehicleNameOrType,
        departureTime: schedule.departureTime,
        journeyDate: schedule.journeyDate,
        seats: booking.passengerDetails.map((p) => p.seatNumber),
        totalAmount: amount,
        paymentMethod: 'Card',
        paymentStatus: 'SUCCESS',
      });

      return { payment, receipt };
    })();

    // Dispatch notification
    await this.notificationAdapter.sendNotification({
      recipient: passenger.email,
      subject: `Booking Confirmed #${bookingId} [${result.receipt.ticketNumber}]`,
      message: `Dear ${passenger.name}, your booking for ${schedule.route.source} to ${schedule.route.destination} is confirmed. Ticket: ${result.receipt.ticketNumber}`,
      type: 'EMAIL',
    });

    return result;
  }

  public async processUPIPayment(data: {
    bookingId: number;
    amount: number;
    upiId: string;
    provider: string;
  }): Promise<{ payment: UPIPayment; receipt: Receipt }> {
    const { bookingId, amount, upiId, provider } = data;

    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (booking.bookingStatus === 'CONFIRMED') {
      throw new ConflictError('This booking has already been paid for and confirmed');
    }
    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestError('Cannot process payment for a cancelled booking');
    }

    // Call Mock Gateway Adapter
    const gatewayRes = await this.gatewayAdapter.processUPIPayment({
      upiId,
      provider,
      amount,
    });

    if (!gatewayRes.success) {
      this.paymentRepo.createUPIPayment(bookingId, amount, upiId, provider, 'FAILED');
      throw new BadRequestError(`Payment failed: ${gatewayRes.message}`);
    }

    const schedule = this.scheduleRepo.findWithDetails(booking.scheduleId)!;
    const passenger = this.passengerRepo.findById(booking.passengerId)!;

    const result = db.transaction(() => {
      // 1. Create completed UPI payment record
      const payment = this.paymentRepo.createUPIPayment(bookingId, amount, upiId, provider, 'SUCCESS');

      // 2. Transition booking to CONFIRMED
      this.bookingRepo.updateStatus(bookingId, 'CONFIRMED');

      // 3. Decrement available seats in vehicle inventory
      if (schedule.trainId) {
        for (let i = 0; i < booking.passengerDetails.length; i++) {
          this.trainRepo.reserveSeat(booking.scheduleId, booking.passengerDetails[i].seatNumber);
        }
      } else if (schedule.busId) {
        for (let i = 0; i < booking.passengerDetails.length; i++) {
          this.busRepo.reserveSeat(booking.scheduleId, booking.passengerDetails[i].seatNumber);
        }
      }

      // 4. Generate Receipt
      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const receipt = this.receiptRepo.create(bookingId, ticketNumber, new Date().toISOString().split('T')[0], {
        passengerName: passenger.name,
        routeSource: schedule.route.source,
        routeDestination: schedule.route.destination,
        vehicleType: schedule.vehicleType,
        vehicleNameOrType: schedule.vehicleNameOrType,
        departureTime: schedule.departureTime,
        journeyDate: schedule.journeyDate,
        seats: booking.passengerDetails.map((p) => p.seatNumber),
        totalAmount: amount,
        paymentMethod: 'UPI',
        paymentStatus: 'SUCCESS',
      });

      return { payment, receipt };
    })();

    // Dispatch notification
    await this.notificationAdapter.sendNotification({
      recipient: passenger.email,
      subject: `Booking Confirmed #${bookingId} [${result.receipt.ticketNumber}]`,
      message: `Dear ${passenger.name}, your UPI booking for ${schedule.route.source} to ${schedule.route.destination} is confirmed. Ticket: ${result.receipt.ticketNumber}`,
      type: 'EMAIL',
    });

    return result;
  }

  public processRefund(bookingId: number): boolean {
    return this.paymentRepo.updateStatusByBookingId(bookingId, 'REFUNDED');
  }

  public getReceiptByBookingId(bookingId: number): Receipt {
    const receipt = this.receiptRepo.findByBookingId(bookingId);
    if (!receipt) {
      throw new NotFoundError(`Receipt for booking ${bookingId} not found`);
    }
    return receipt;
  }

  public getPaymentByBookingId(bookingId: number): Payment | null {
    return this.paymentRepo.findByBookingId(bookingId);
  }
}
