import { db } from '../config/database';
import { Booking, PassengerDetail, BookingStatus } from '../types/domain';

export class BookingRepository {
  public create(
    passengerId: number,
    scheduleId: number,
    passengerDetails: PassengerDetail[],
    status: BookingStatus = 'INITIATED'
  ): Booking {
    const stmt = db.prepare(`
      INSERT INTO bookings (passenger_id, schedule_id, passenger_details, booking_status)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(passengerId, scheduleId, JSON.stringify(passengerDetails), status);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(bookingId: number): Booking | null {
    const row = db.prepare(`
      SELECT booking_id as bookingId, passenger_id as passengerId, schedule_id as scheduleId,
             passenger_details as passengerDetailsJson, booking_date as bookingDate,
             booking_status as bookingStatus
      FROM bookings WHERE booking_id = ?
    `).get(bookingId) as any;

    if (!row) return null;

    return {
      bookingId: row.bookingId,
      passengerId: row.passengerId,
      scheduleId: row.scheduleId,
      passengerDetails: JSON.parse(row.passengerDetailsJson),
      bookingDate: row.bookingDate,
      bookingStatus: row.bookingStatus,
    };
  }

  public findByPassengerId(passengerId: number): Booking[] {
    const rows = db.prepare(`
      SELECT booking_id as bookingId, passenger_id as passengerId, schedule_id as scheduleId,
             passenger_details as passengerDetailsJson, booking_date as bookingDate,
             booking_status as bookingStatus
      FROM bookings WHERE passenger_id = ?
      ORDER BY booking_id DESC
    `).all(passengerId) as any[];

    return rows.map((row) => ({
      bookingId: row.bookingId,
      passengerId: row.passengerId,
      scheduleId: row.scheduleId,
      passengerDetails: JSON.parse(row.passengerDetailsJson),
      bookingDate: row.bookingDate,
      bookingStatus: row.bookingStatus,
    }));
  }

  public findAll(): Booking[] {
    const rows = db.prepare(`
      SELECT booking_id as bookingId, passenger_id as passengerId, schedule_id as scheduleId,
             passenger_details as passengerDetailsJson, booking_date as bookingDate,
             booking_status as bookingStatus
      FROM bookings
      ORDER BY booking_id DESC
    `).all() as any[];

    return rows.map((row) => ({
      bookingId: row.bookingId,
      passengerId: row.passengerId,
      scheduleId: row.scheduleId,
      passengerDetails: JSON.parse(row.passengerDetailsJson),
      bookingDate: row.bookingDate,
      bookingStatus: row.bookingStatus,
    }));
  }

  public findAllWithDetails(): any[] {
    const rows = db.prepare(`
      SELECT b.booking_id as bookingId, b.passenger_id as passengerId, b.schedule_id as scheduleId,
             b.passenger_details as passengerDetailsJson, b.booking_date as bookingDate,
             b.booking_status as bookingStatus,
             p.name as passengerName, u.email as passengerEmail,
             r.source as routeSource, r.destination as routeDestination,
             s.journey_date as journeyDate,
             CASE WHEN s.train_id IS NOT NULL THEN 'Train' ELSE 'Bus' END as vehicleType,
             CASE WHEN s.train_id IS NOT NULL THEN t.train_name ELSE bs.bus_type END as vehicleNameOrType,
             pay.payment_status as paymentStatus,
             pay.amount as amount
      FROM bookings b
      LEFT JOIN passengers p ON b.passenger_id = p.passenger_id
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN schedules s ON b.schedule_id = s.schedule_id
      LEFT JOIN routes r ON s.route_id = r.route_id
      LEFT JOIN trains t ON s.train_id = t.train_id
      LEFT JOIN buses bs ON s.bus_id = bs.bus_id
      LEFT JOIN payments pay ON b.booking_id = pay.booking_id
      ORDER BY b.booking_id DESC
    `).all() as any[];

    return rows.map((row) => ({
      bookingId: row.bookingId,
      passengerId: row.passengerId,
      passengerName: row.passengerName || 'Unknown Passenger',
      passengerEmail: row.passengerEmail || '',
      scheduleId: row.scheduleId,
      routeSource: row.routeSource || 'N/A',
      routeDestination: row.routeDestination || 'N/A',
      vehicleType: row.vehicleType || 'Train',
      vehicleNameOrType: row.vehicleNameOrType || '',
      journeyDate: row.journeyDate || '',
      passengerDetails: JSON.parse(row.passengerDetailsJson || '[]'),
      bookingDate: row.bookingDate,
      bookingStatus: row.bookingStatus,
      paymentStatus: row.paymentStatus || undefined,
      amount: row.amount != null ? Number(row.amount) : undefined,
    }));
  }

  public updateStatus(bookingId: number, status: BookingStatus): boolean {
    const info = db.prepare(`
      UPDATE bookings SET booking_status = ? WHERE booking_id = ?
    `).run(status, bookingId);
    return info.changes > 0;
  }

  public findReservedSeatsBySchedule(scheduleId: number): string[] {
    const rows = db.prepare(`
      SELECT passenger_details as passengerDetailsJson
      FROM bookings
      WHERE schedule_id = ? AND booking_status IN ('INITIATED', 'CONFIRMED')
    `).all(scheduleId) as { passengerDetailsJson: string }[];

    const reservedSeats: string[] = [];
    for (const r of rows) {
      try {
        const details: PassengerDetail[] = JSON.parse(r.passengerDetailsJson);
        for (const d of details) {
          if (d.seatNumber) {
            reservedSeats.push(d.seatNumber);
          }
        }
      } catch {
        // ignore parse error
      }
    }
    return reservedSeats;
  }
}
