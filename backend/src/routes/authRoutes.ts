import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/authMiddleware';

export const authRouter = Router();
const authController = new AuthController();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
authRouter.put('/profile', authenticate, authController.updateProfile);
authRouter.post('/change-password', authenticate, authController.changePassword);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/oauth/google', authController.oauthGoogle);
authRouter.post('/oauth/apple', authController.oauthApple);

