import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userName, email, password, name, phoneNo } = req.body;
      const result = this.authService.registerPassenger({ userName, email, password, name, phoneNo });
      res.status(201).json({
        success: true,
        message: 'Passenger registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { emailOrUsername, password } = req.body;
      const result = this.authService.login({ emailOrUsername, password });
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const profile = this.authService.getCurrentProfile(req.user.userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, phoneNo } = req.body;
      const updated = this.authService.updateProfile(req.user!.userId, name, phoneNo);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      this.authService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public oauthGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      const result = await this.authService.loginWithOAuth('Google', token || 'google_token_sample');
      res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public oauthApple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      const result = await this.authService.loginWithOAuth('Apple', token || 'apple_token_sample');
      res.status(200).json({
        success: true,
        message: 'Apple authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = this.authService.forgotPassword(email);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { resetToken, newPassword } = req.body;
      this.authService.resetPassword(resetToken, newPassword);
      res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
      next(error);
    }
  };
}
