import { createApp } from './app';
import { ENV } from './config/env';
import { initDatabase } from './config/database';
import { seedDatabase } from './config/seed';

// Initialize Database Schema & Seed Data
try {
  initDatabase();
  console.log('✅ SQLite Database connected and schema initialized.');
  seedDatabase();
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`🚀 Ticket Booking and Reservation System Backend running on http://localhost:${ENV.PORT}`);
  console.log(`📡 Environment: ${ENV.NODE_ENV}`);
});
