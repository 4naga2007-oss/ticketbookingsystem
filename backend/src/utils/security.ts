import crypto from 'crypto';

/**
 * Hash password using PBKDF2 with a secure salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generate secure session / auth token
 */
export function generateToken(payload: {
  userId: number;
  role: string;
  email: string;
  passengerId?: number;
  adminId?: number;
}): string {
  const secret = process.env.JWT_SECRET || 'super_secret_ooad_session_key_2026';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify session / auth token
 */
export function verifyToken(token: string): {
  userId: number;
  role: string;
  email: string;
  passengerId?: number;
  adminId?: number;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = process.env.JWT_SECRET || 'super_secret_ooad_session_key_2026';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Mask payment card number for secure storage (e.g. "**** **** **** 1234")
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  if (clean.length < 4) return '**** **** **** 0000';
  const last4 = clean.slice(-4);
  return `**** **** **** ${last4}`;
}
