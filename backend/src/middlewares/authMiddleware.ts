import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/security';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserAccountRepository } from '../repositories/UserAccountRepository';
import { PassengerRepository } from '../repositories/PassengerRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { UserRole } from '../types/domain';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: UserRole;
    email: string;
    passengerId?: number;
    adminId?: number;
  };
}

const userAccountRepo = new UserAccountRepository();
const passengerRepo = new PassengerRepository();
const adminRepo = new AdminRepository();

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header with Bearer token is required');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }

  // Verify account is active
  const account = userAccountRepo.findByUserId(payload.userId);
  if (account && account.accountStatus !== 'Active') {
    throw new ForbiddenError(`Account is ${account.accountStatus}. Please contact support.`);
  }

  // Ensure passengerId / adminId are attached
  let passengerId = payload.passengerId;
  let adminId = payload.adminId;

  const isPassengerRole = payload.role === 'PASSENGER';
  const isAdminRole = payload.role === 'ADMIN';

  if (isPassengerRole && !passengerId) {
    const passenger = passengerRepo.findByUserId(payload.userId);
    passengerId = passenger?.passengerId;
  } else if (isAdminRole && !adminId) {
    const admin = adminRepo.findByUserId(payload.userId);
    adminId = admin?.adminId;
  }

  req.user = {
    userId: payload.userId,
    role: payload.role as UserRole,
    email: payload.email,
    passengerId,
    adminId,
  };

  next();
}

export function requirePassenger(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  const isPassenger = req.user.role === 'PASSENGER';
  if (!isPassenger) {
    throw new ForbiddenError('Access restricted to passengers only');
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  const isAdmin = req.user.role === 'ADMIN';
  if (!isAdmin) {
    throw new ForbiddenError('Access restricted to administrators only');
  }
  next();
}
