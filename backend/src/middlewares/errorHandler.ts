import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.constructor.name,
    });
    return;
  }

  // Handle SQLite constraint violation errors gracefully
  if (err.message && err.message.includes('CHECK constraint failed')) {
    res.status(400).json({
      success: false,
      message: 'Database check constraint failed: Invalid data submitted',
      error: 'ValidationError',
    });
    return;
  }

  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({
      success: false,
      message: 'A record with this information already exists',
      error: 'ConflictError',
    });
    return;
  }

  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: 'InternalServerError',
  });
}
