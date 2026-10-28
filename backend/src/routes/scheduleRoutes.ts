import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

export const scheduleRouter = Router();
const scheduleController = new ScheduleController();

// Public schedule & route lookups
scheduleRouter.get('/', scheduleController.getAllSchedules);
scheduleRouter.get('/routes', scheduleController.getAllRoutes);
scheduleRouter.get('/trains', scheduleController.getAllTrains);
scheduleRouter.get('/buses', scheduleController.getAllBuses);
scheduleRouter.get('/:id', scheduleController.getScheduleById);

// Admin-only schedule & route modifications
scheduleRouter.post('/', authenticate, requireAdmin, scheduleController.createSchedule);
scheduleRouter.put('/:id', authenticate, requireAdmin, scheduleController.updateSchedule);
scheduleRouter.delete('/:id', authenticate, requireAdmin, scheduleController.deleteSchedule);

scheduleRouter.post('/routes', authenticate, requireAdmin, scheduleController.createRoute);
scheduleRouter.post('/trains', authenticate, requireAdmin, scheduleController.createTrain);
scheduleRouter.post('/buses', authenticate, requireAdmin, scheduleController.createBus);
