import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';
import { authenticate, requirePassenger } from '../middlewares/authMiddleware';

export const reservationRouter = Router();
const resController = new ReservationController();

// Public trip search & seat matrix inspection
reservationRouter.get('/search', resController.searchTrips);
reservationRouter.get('/trips/:scheduleId', resController.getTripDetails);
reservationRouter.get('/seats/availability/:scheduleId', resController.getSeatAvailability);

// Authenticated passenger booking & reservation operations
reservationRouter.post('/reserve', authenticate, requirePassenger, resController.createReservationHold);
reservationRouter.get('/bookings/my', authenticate, requirePassenger, resController.getMyBookings);
reservationRouter.get('/bookings/:bookingId', authenticate, resController.getBooking);
reservationRouter.post('/bookings/:bookingId/cancel', authenticate, resController.cancelBooking);
