import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';
import { BookingService } from '../services/BookingService';
import { PaymentService } from '../services/PaymentService';
import { PassengerRepository } from '../repositories/PassengerRepository';
import { UserAccountRepository } from '../repositories/UserAccountRepository';
import { UserRepository } from '../repositories/UserRepository';

export class AdminController {
  private reportService: ReportService;
  private bookingService: BookingService;
  private paymentService: PaymentService;
  private passengerRepo: PassengerRepository;
  private userAccountRepo: UserAccountRepository;
  private userRepo: UserRepository;

  constructor() {
    this.reportService = new ReportService();
    this.bookingService = new BookingService();
    this.paymentService = new PaymentService();
    this.passengerRepo = new PassengerRepository();
    this.userAccountRepo = new UserAccountRepository();
    this.userRepo = new UserRepository();
  }

  public getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = this.reportService.generateSystemReport();
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  public getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const passengers = this.passengerRepo.findAll();
      res.status(200).json({ success: true, count: passengers.length, data: passengers });
    } catch (error) {
      next(error);
    }
  };

  public updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(String(req.params.userId), 10);
      // Accept either `accountStatus` (frontend canonical) or legacy `status`
      const accountStatus = req.body.accountStatus ?? req.body.status;
      if (!accountStatus) {
        res.status(400).json({ success: false, message: 'accountStatus is required', error: 'BadRequestError' });
        return;
      }
      const updated = this.userAccountRepo.updateStatus(userId, accountStatus);
      res.status(200).json({
        success: updated,
        message: `User account status updated to ${accountStatus}`,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookings = this.bookingService.getAllBookings();
      res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
      next(error);
    }
  };

  public approveRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.body;
      const id = Number(bookingId);

      // Verify booking is cancelled and update payment to REFUNDED
      const booking = this.bookingService.getBookingById(id);
      this.paymentService.processRefund(id);

      res.status(200).json({
        success: true,
        message: `Refund for booking #${id} has been approved and payment status updated to REFUNDED.`,
        bookingId: id,
        refundStatus: 'REFUNDED',
      });
    } catch (error) {
      next(error);
    }
  };

  public getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = this.reportService.generateSystemReport();
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };
}
