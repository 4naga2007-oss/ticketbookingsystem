import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate } from '../middlewares/authMiddleware';

export const paymentRouter = Router();
const payController = new PaymentController();

paymentRouter.post('/process/card', authenticate, payController.processCardPayment);
paymentRouter.post('/process/upi', authenticate, payController.processUPIPayment);
paymentRouter.get('/receipt/:bookingId', authenticate, payController.getReceipt);
paymentRouter.get('/details/:bookingId', authenticate, payController.getPaymentDetails);
