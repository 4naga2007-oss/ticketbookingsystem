import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

export const adminRouter = Router();
const adminController = new AdminController();

// All admin routes require authentication & admin role
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/dashboard-stats', adminController.getDashboardStats);
adminRouter.get('/users', adminController.getAllUsers);
adminRouter.patch('/users/:userId/status', adminController.updateUserStatus);
adminRouter.get('/bookings', adminController.getAllBookings);
adminRouter.post('/refunds/approve', adminController.approveRefund);
adminRouter.get('/reports', adminController.getReports);
