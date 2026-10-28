import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/PaymentService';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  public processCardPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId, amount, cardNumber, cardType, bankName, expiry } = req.body;
      const result = await this.paymentService.processCardPayment({
        bookingId: Number(bookingId),
        amount: Number(amount),
        cardNumber: String(cardNumber),
        cardType: String(cardType || 'Visa'),
        bankName: String(bankName || 'HDFC Bank'),
        expiry: String(expiry || '12/28'),
      });

      res.status(200).json({
        success: true,
        message: 'Card payment confirmed and e-ticket generated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public processUPIPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId, amount, upiId, provider } = req.body;
      const result = await this.paymentService.processUPIPayment({
        bookingId: Number(bookingId),
        amount: Number(amount),
        upiId: String(upiId),
        provider: String(provider || 'Google Pay'),
      });

      res.status(200).json({
        success: true,
        message: 'UPI payment confirmed and e-ticket generated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getReceipt = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = parseInt(String(req.params.bookingId), 10);
      const receipt = this.paymentService.getReceiptByBookingId(bookingId);
      const payment = this.paymentService.getPaymentByBookingId(bookingId);
      const booking = { bookingId, bookingStatus: 'CONFIRMED' };

      res.status(200).json({
        success: true,
        data: {
          ...receipt,
          receipt,
          payment,
          booking,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getPaymentDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = parseInt(String(req.params.bookingId), 10);
      const payment = this.paymentService.getPaymentByBookingId(bookingId);
      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };
}
