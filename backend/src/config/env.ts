import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_FILE: process.env.DB_FILE || path.resolve(__dirname, '../../ticketing.db'),
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_ooad_session_key_2026',
  SESSION_TIMEOUT_MINUTES: process.env.SESSION_TIMEOUT_MINUTES
    ? parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10)
    : 30,
};
