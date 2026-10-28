import { db } from '../config/database';
import { Train, Reservable } from '../types/domain';

export class TrainRepository implements Reservable {
  public create(trainName: string, totalSeats: number = 40): Train {
    const stmt = db.prepare(`
      INSERT INTO trains (train_name, available_seats, total_seats)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(trainName, totalSeats, totalSeats);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(trainId: number): Train | null {
    const row = db.prepare(`
      SELECT train_id as trainId, train_name as trainName,
             available_seats as availableSeats, total_seats as totalSeats
      FROM trains WHERE train_id = ?
    `).get(trainId) as Train | undefined;
    return row || null;
  }

  public findAll(): Train[] {
    return db.prepare(`
      SELECT train_id as trainId, train_name as trainName,
             available_seats as availableSeats, total_seats as totalSeats
      FROM trains ORDER BY train_id ASC
    `).all() as Train[];
  }

  public update(trainId: number, trainName: string, totalSeats: number): boolean {
    const info = db.prepare(`
      UPDATE trains SET train_name = ?, total_seats = ? WHERE train_id = ?
    `).run(trainName, totalSeats, trainId);
    return info.changes > 0;
  }

  public delete(trainId: number): boolean {
    const info = db.prepare('DELETE FROM trains WHERE train_id = ?').run(trainId);
    return info.changes > 0;
  }

  // Implementation of Reservable interface
  public checkAvailability(scheduleId: number): number {
    const row = db.prepare(`
      SELECT t.available_seats as availableSeats
      FROM schedules s
      JOIN trains t ON s.train_id = t.train_id
      WHERE s.schedule_id = ?
    `).get(scheduleId) as { availableSeats: number } | undefined;
    return row ? row.availableSeats : 0;
  }

  public reserveSeat(scheduleId: number, seatNumber: string): boolean {
    const row = db.prepare(`
      SELECT t.train_id as trainId, t.available_seats as availableSeats
      FROM schedules s
      JOIN trains t ON s.train_id = t.train_id
      WHERE s.schedule_id = ?
    `).get(scheduleId) as { trainId: number; availableSeats: number } | undefined;

    if (!row || row.availableSeats <= 0) return false;

    const info = db.prepare(`
      UPDATE trains SET available_seats = available_seats - 1
      WHERE train_id = ? AND available_seats > 0
    `).run(row.trainId);
    return info.changes > 0;
  }

  public releaseSeat(trainId: number, count: number = 1): void {
    db.prepare(`
      UPDATE trains SET available_seats = MIN(total_seats, available_seats + ?)
      WHERE train_id = ?
    `).run(count, trainId);
  }
}
