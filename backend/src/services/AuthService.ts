import crypto from 'crypto';
import { UserRepository } from '../repositories/UserRepository';
import { PassengerRepository } from '../repositories/PassengerRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { UserAccountRepository } from '../repositories/UserAccountRepository';
import { SessionManager, SessionContext } from './SessionManager';
import { OAuthAdapter } from '../adapters/OAuthAdapter';
import { hashPassword, verifyPassword } from '../utils/security';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { User, Passenger, Admin, UserAccount, UserRole } from '../types/domain';

/** In-memory store for password-reset tokens: token → { userId, expiresAt } */
const resetTokenStore = new Map<string, { userId: number; expiresAt: number }>();

export class AuthService {
  private userRepo: UserRepository;
  private passengerRepo: PassengerRepository;
  private adminRepo: AdminRepository;
  private userAccountRepo: UserAccountRepository;
  private sessionManager: SessionManager;
  private oauthAdapter: OAuthAdapter;

  constructor() {
    this.userRepo = new UserRepository();
    this.passengerRepo = new PassengerRepository();
    this.adminRepo = new AdminRepository();
    this.userAccountRepo = new UserAccountRepository();
    this.sessionManager = new SessionManager();
    this.oauthAdapter = new OAuthAdapter();
  }

  public registerPassenger(data: {
    userName: string;
    email: string;
    password: string;
    name: string;
    phoneNo: string;
  }): { passenger: Passenger; session: SessionContext } {
    if (!data.userName || !data.email || !data.password || !data.name || !data.phoneNo) {
      throw new BadRequestError('All fields (userName, email, password, name, phoneNo) are required');
    }

    if (this.userRepo.findByEmail(data.email)) {
      throw new ConflictError('A user with this email already exists');
    }
    if (this.userRepo.findByUsername(data.userName)) {
      throw new ConflictError('A user with this username already exists');
    }

    const passwordHash = hashPassword(data.password);
    const user = this.userRepo.create({
      userName: data.userName,
      email: data.email,
      password: passwordHash,
      role: 'PASSENGER',
    });

    const passenger = this.passengerRepo.create(user.userId, data.name, data.phoneNo);
    this.userAccountRepo.create(user.userId, 'Active');

    const session = this.sessionManager.createSession({
      userId: user.userId,
      role: 'PASSENGER',
      email: user.email,
      passengerId: passenger.passengerId,
    });

    return { passenger, session };
  }

  public login(credentials: { emailOrUsername: string; password: string }): {
    user: User;
    passenger?: Passenger;
    admin?: Admin;
    account: UserAccount;
    session: SessionContext;
  } {
    if (!credentials.emailOrUsername || !credentials.password) {
      throw new BadRequestError('Email/Username and Password are required');
    }

    const user =
      this.userRepo.findByEmail(credentials.emailOrUsername) ||
      this.userRepo.findByUsername(credentials.emailOrUsername);

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email/username or password');
    }

    if (!verifyPassword(credentials.password, user.password)) {
      throw new UnauthorizedError('Invalid email/username or password');
    }

    const account = this.userAccountRepo.findByUserId(user.userId);
    if (!account) {
      throw new NotFoundError('User account not found');
    }

    if (account.accountStatus !== 'Active') {
      throw new UnauthorizedError(`Account is currently ${account.accountStatus}. Please contact support.`);
    }

    let passenger: Passenger | undefined;
    let admin: Admin | undefined;

    const isPassenger = user.role === 'PASSENGER';
    if (isPassenger) {
      passenger = this.passengerRepo.findByUserId(user.userId) || undefined;
    } else {
      admin = this.adminRepo.findByUserId(user.userId) || undefined;
    }

    const session = this.sessionManager.createSession({
      userId: user.userId,
      role: user.role as UserRole,
      email: user.email,
      passengerId: passenger?.passengerId,
      adminId: admin?.adminId,
    });

    // Strip password from returned user object
    const { password: _, ...userSafe } = user;

    return {
      user: userSafe as User,
      passenger,
      admin,
      account,
      session,
    };
  }

  public getCurrentProfile(userId: number) {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const account = this.userAccountRepo.findByUserId(userId);
    const passenger = this.passengerRepo.findByUserId(userId);
    const admin = this.adminRepo.findByUserId(userId);

    const { password: _, ...userSafe } = user;
    return {
      user: userSafe,
      passenger,
      admin,
      account,
    };
  }

  public updateProfile(userId: number, name: string, phoneNo: string): Passenger {
    const passenger = this.passengerRepo.findByUserId(userId);
    if (!passenger) {
      throw new NotFoundError('Passenger record not found for user');
    }
    this.passengerRepo.updateProfile(passenger.passengerId, name, phoneNo);
    return this.passengerRepo.findById(passenger.passengerId)!;
  }

  public changePassword(userId: number, currentPass: string, newPass: string): boolean {
    const user = this.userRepo.findById(userId);
    if (!user || !user.password) {
      throw new NotFoundError('User not found');
    }
    if (!verifyPassword(currentPass, user.password)) {
      throw new BadRequestError('Current password is incorrect');
    }
    const newHash = hashPassword(newPass);
    return this.userRepo.updatePassword(userId, newHash);
  }

  /** Step 1 – user submits email. Returns a short-lived reset token (shown in UI since no email server). */
  public forgotPassword(email: string): { resetToken: string; message: string } {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) throw new BadRequestError('Email is required');

    const user = this.userRepo.findByEmail(trimmed);
    if (!user) {
      // Always return success message to prevent email enumeration
      return { resetToken: '', message: 'If this email is registered, a reset code has been generated.' };
    }

    // Purge any existing token for this user
    for (const [t, v] of resetTokenStore.entries()) {
      if (v.userId === user.userId) resetTokenStore.delete(t);
    }

    // Generate a 6-character alphanumeric token
    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F9C2"
    resetTokenStore.set(resetToken, {
      userId: user.userId,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return { resetToken, message: 'Reset code generated. Use it to set a new password.' };
  }

  /** Step 2 – user submits token + new password. */
  public resetPassword(resetToken: string, newPassword: string): void {
    const token = (resetToken || '').trim().toUpperCase();
    if (!token || !newPassword) throw new BadRequestError('Reset code and new password are required');
    if (newPassword.length < 6) throw new BadRequestError('Password must be at least 6 characters');

    const entry = resetTokenStore.get(token);
    if (!entry) throw new BadRequestError('Invalid or expired reset code');
    if (Date.now() > entry.expiresAt) {
      resetTokenStore.delete(token);
      throw new BadRequestError('Reset code has expired. Please request a new one');
    }

    const newHash = hashPassword(newPassword);
    const updated = this.userRepo.updatePassword(entry.userId, newHash);
    if (!updated) throw new NotFoundError('User not found');

    resetTokenStore.delete(token); // One-time use
  }

  public async loginWithOAuth(provider: 'Google' | 'Apple', token: string) {
    const profile =
      provider === 'Google'
        ? await this.oauthAdapter.verifyGoogleToken(token)
        : await this.oauthAdapter.verifyAppleToken(token);

    let user = this.userRepo.findByEmail(profile.email);
    let passenger: Passenger | null = null;

    if (!user) {
      const randomPass = hashPassword(Math.random().toString(36));
      user = this.userRepo.create({
        userName: profile.email.split('@')[0] + Math.floor(Math.random() * 100),
        email: profile.email,
        password: randomPass,
        role: 'PASSENGER',
      });
      passenger = this.passengerRepo.create(user.userId, profile.name, '9999999999');
      this.userAccountRepo.create(user.userId, 'Active');
    } else {
      passenger = this.passengerRepo.findByUserId(user.userId);
    }

    const session = this.sessionManager.createSession({
      userId: user.userId,
      role: user.role as UserRole,
      email: user.email,
      passengerId: passenger?.passengerId,
    });

    return {
      user: { userId: user.userId, userName: user.userName, email: user.email, role: user.role },
      passenger,
      session,
    };
  }
}
