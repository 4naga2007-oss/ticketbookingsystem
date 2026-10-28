import { db } from '../config/database';
import { Bus, Reservable } from '../types/domain';

export class BusRepository implements Reservable {
  public create(busType: string, totalSeats: number = 32): Bus {
    const stmt = db.prepare(`
      INSERT INTO buses (bus_type, available_seats, total_seats)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(busType, totalSeats, totalSeats);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(busId: number): Bus | null {
    const row = db.prepare(`
      SELECT bus_id as busId, bus_type as busType,
             available_seats as availableSeats, total_seats as totalSeats
      FROM buses WHERE bus_id = ?
    `).get(busId) as Bus | undefined;
    return row || null;
  }

  public findAll(): Bus[] {
    return db.prepare(`
      SELECT bus_id as busId, bus_type as busType,
             available_seats as availableSeats, total_seats as totalSeats
      FROM buses ORDER BY bus_id ASC
    `).all() as Bus[];
  }

  public update(busId: number, busType: string, totalSeats: number): boolean {
    const info = db.prepare(`
      UPDATE buses SET bus_type = ?, total_seats = ? WHERE bus_id = ?
    `).run(busType, totalSeats, busId);
    return info.changes > 0;
  }

  public delete(busId: number): boolean {
    const info = db.prepare('DELETE FROM buses WHERE bus_id = ?').run(busId);
    return info.changes > 0;
  }

  // Implementation of Reservable interface
  public checkAvailability(scheduleId: number): number {
    const row = db.prepare(`
      SELECT b.available_seats as availableSeats
      FROM schedules s
      JOIN buses b ON s.bus_id = b.bus_id
      WHERE s.schedule_id = ?
    `).get(scheduleId) as { availableSeats: number } | undefined;
    return row ? row.availableSeats : 0;
  }

  public reserveSeat(scheduleId: number, seatNumber: string): boolean {
    const row = db.prepare(`
      SELECT b.bus_id as busId, b.available_seats as availableSeats
      FROM schedules s
      JOIN buses b ON s.bus_id = b.bus_id
      WHERE s.schedule_id = ?
    `).get(scheduleId) as { busId: number; availableSeats: number } | undefined;

    if (!row || row.availableSeats <= 0) return false;

    const info = db.prepare(`
      UPDATE buses SET available_seats = available_seats - 1
      WHERE bus_id = ? AND available_seats > 0
    `).run(row.busId);
    return info.changes > 0;
  }

  public releaseSeat(busId: number, count: number = 1): void {
    db.prepare(`
      UPDATE buses SET available_seats = MIN(total_seats, available_seats + ?)
      WHERE bus_id = ?
    `).run(count, busId);
  }
}
