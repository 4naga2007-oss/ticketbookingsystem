import { generateToken, verifyToken } from '../utils/security';
import { UserAccountRepository } from '../repositories/UserAccountRepository';
import { UserRole } from '../types/domain';

export interface SessionContext {
  userId: number;
  role: UserRole;
  email: string;
  passengerId?: number;
  adminId?: number;
  token: string;
}

export class SessionManager {
  private userAccountRepo: UserAccountRepository;

  constructor() {
    this.userAccountRepo = new UserAccountRepository();
  }

  public createSession(user: {
    userId: number;
    role: UserRole;
    email: string;
    passengerId?: number;
    adminId?: number;
  }): SessionContext {
    const token = generateToken({
      userId: user.userId,
      role: user.role,
      email: user.email,
      passengerId: user.passengerId,
      adminId: user.adminId,
    });

    this.userAccountRepo.updateLastLogin(user.userId);

    return {
      userId: user.userId,
      role: user.role,
      email: user.email,
      passengerId: user.passengerId,
      adminId: user.adminId,
      token,
    };
  }

  public validateSession(token: string) {
    return verifyToken(token);
  }
}
