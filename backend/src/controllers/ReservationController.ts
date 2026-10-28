import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/TripService';
import { SeatAvailabilityService } from '../services/SeatAvailabilityService';
import { BookingService } from '../services/BookingService';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ReservationController {
  private tripService: TripService;
  private seatService: SeatAvailabilityService;
  private bookingService: BookingService;

  constructor() {
    this.tripService = new TripService();
    this.seatService = new SeatAvailabilityService();
    this.bookingService = new BookingService();
  }

  public searchTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { source, destination, journeyDate, vehicleType } = req.query;
      const results = this.tripService.searchTrips({
        source: String(source || ''),
        destination: String(destination || ''),
        journeyDate: journeyDate ? String(journeyDate) : undefined,
        vehicleType: vehicleType as any,
      });

      res.status(200).json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTripDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleId = parseInt(String(req.params.scheduleId), 10);
      const trip = this.tripService.getTripDetails(scheduleId);
      res.status(200).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSeatAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleId = parseInt(String(req.params.scheduleId), 10);
      const availability = this.seatService.getSeatAvailability(scheduleId);
      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  };

  public createReservationHold = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scheduleId, passengerDetails } = req.body;
      const passengerId = req.user!.passengerId!;

      const booking = this.bookingService.createBooking({
        passengerId,
        scheduleId: Number(scheduleId),
        passengerDetails,
      });

      res.status(201).json({
        success: true,
        message: 'Seats held successfully. Please complete payment to confirm booking.',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  };

  public getBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = parseInt(String(req.params.bookingId), 10);
      const isPassenger = req.user?.role === 'PASSENGER';
      const booking = this.bookingService.getBookingById(
        bookingId,
        isPassenger ? req.user?.passengerId : undefined
      );

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMyBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const passengerId = req.user!.passengerId!;
      const bookings = this.bookingService.getPassengerBookings(passengerId);
      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  };

  public cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = parseInt(String(req.params.bookingId), 10);
      const isPassenger = req.user?.role === 'PASSENGER';
      const result = this.bookingService.cancelBooking(
        bookingId,
        isPassenger ? req.user?.passengerId : undefined
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
