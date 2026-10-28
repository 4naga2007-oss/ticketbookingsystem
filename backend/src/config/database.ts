import Database from 'better-sqlite3';
import { ENV } from './env';

export const db = new Database(ENV.DB_FILE);

// Enable foreign key constraints and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

/**
 * Initialize relational SQLite tables matching the approved UML schema.
 */
export function initDatabase(): void {
  const schemaStatements = `
    -- Users table (Base class representation)
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('PASSENGER', 'ADMIN')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Passengers table (Specialization of User)
    CREATE TABLE IF NOT EXISTS passengers (
      passenger_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone_no TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- Admins table (Specialization of User)
    CREATE TABLE IF NOT EXISTS admins (
      admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- User Accounts table (Composition with Passenger, managed by Admin)
    CREATE TABLE IF NOT EXISTS user_accounts (
      account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      account_status TEXT NOT NULL DEFAULT 'Active' CHECK (account_status IN ('Active', 'Inactive', 'Suspended')),
      last_login DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- Trains table (Distinct domain concept implementing Reservable)
    CREATE TABLE IF NOT EXISTS trains (
      train_id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_name TEXT NOT NULL,
      available_seats INTEGER NOT NULL,
      total_seats INTEGER NOT NULL
    );

    -- Buses table (Distinct domain concept implementing Reservable)
    CREATE TABLE IF NOT EXISTS buses (
      bus_id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_type TEXT NOT NULL,
      available_seats INTEGER NOT NULL,
      total_seats INTEGER NOT NULL
    );

    -- Routes table
    CREATE TABLE IF NOT EXISTS routes (
      route_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      distance REAL NOT NULL
    );

    -- Schedules table (Assigned to either Train OR Bus, never both)
    CREATE TABLE IF NOT EXISTS schedules (
      schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      train_id INTEGER,
      bus_id INTEGER,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      journey_date TEXT NOT NULL,
      fare REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Cancelled', 'Completed')),
      FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
      FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE SET NULL,
      FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE SET NULL,
      CHECK (
        (train_id IS NOT NULL AND bus_id IS NULL) OR
        (train_id IS NULL AND bus_id IS NOT NULL)
      )
    );

    -- Bookings table (Contains 1 or more passenger/seat details stored internally)
    CREATE TABLE IF NOT EXISTS bookings (
      booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
      passenger_id INTEGER NOT NULL,
      schedule_id INTEGER NOT NULL,
      passenger_details TEXT NOT NULL, -- JSON string array of { passengerName, passengerAge, passengerGender, seatNumber, fare }
      booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      booking_status TEXT NOT NULL DEFAULT 'INITIATED' CHECK (booking_status IN ('INITIATED', 'CONFIRMED', 'CANCELLED')),
      FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE CASCADE,
      FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE
    );

    -- Payments table (Base payment implementing Payable)
    CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE,
      amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('Card', 'UPI')),
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
    );

    -- Card Payments table (Specialization: Masked card info only, no CVV/PIN/complete card number)
    CREATE TABLE IF NOT EXISTS card_payments (
      payment_id INTEGER PRIMARY KEY,
      card_number_masked TEXT NOT NULL,
      card_type TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE
    );

    -- UPI Payments table (Specialization: UPI ID and provider)
    CREATE TABLE IF NOT EXISTS upi_payments (
      payment_id INTEGER PRIMARY KEY,
      upi_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE
    );

    -- Receipts table (Composition with Booking)
    CREATE TABLE IF NOT EXISTS receipts (
      receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE,
      ticket_number TEXT NOT NULL UNIQUE,
      generate_date DATE NOT NULL,
      receipt_data TEXT NOT NULL, -- JSON formatted receipt details
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
    );
  `;

  db.exec(schemaStatements);
}
