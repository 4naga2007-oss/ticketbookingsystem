import { Router, Request, Response } from 'express';
import { authRouter } from './authRoutes';
import { reservationRouter } from './reservationRoutes';
import { paymentRouter } from './paymentRoutes';
import { scheduleRouter } from './scheduleRoutes';
import { adminRouter } from './adminRoutes';

export const rootRouter = Router();

// Health check endpoint
rootRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    system: 'Ticket Booking and Reservation System',
    timestamp: new Date().toISOString(),
  });
});

// Mount module routers
rootRouter.use('/auth', authRouter);
rootRouter.use('/reservation', reservationRouter);
rootRouter.use('/payment', paymentRouter);
rootRouter.use('/schedule', scheduleRouter);
rootRouter.use('/admin', adminRouter);
