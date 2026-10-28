import { db } from '../config/database';
import { Passenger } from '../types/domain';

export class PassengerRepository {
  public create(userId: number, name: string, phoneNo: string): Passenger {
    const stmt = db.prepare(`
      INSERT INTO passengers (user_id, name, phone_no)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(userId, name, phoneNo);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(passengerId: number): Passenger | null {
    const row = db.prepare(`
      SELECT p.passenger_id as passengerId, p.user_id as userId, p.name, p.phone_no as phoneNo,
             u.user_name as userName, u.email, u.role, u.created_at as createdAt
      FROM passengers p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.passenger_id = ?
    `).get(passengerId) as Passenger | undefined;
    return row || null;
  }

  public findByUserId(userId: number): Passenger | null {
    const row = db.prepare(`
      SELECT p.passenger_id as passengerId, p.user_id as userId, p.name, p.phone_no as phoneNo,
             u.user_name as userName, u.email, u.role, u.created_at as createdAt
      FROM passengers p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.user_id = ?
    `).get(userId) as Passenger | undefined;
    return row || null;
  }

  public findAll(): Passenger[] {
    return db.prepare(`
      SELECT p.passenger_id as passengerId, p.user_id as userId, p.name, p.phone_no as phoneNo,
             u.user_name as userName, u.email, u.role, u.created_at as createdAt,
             a.account_status as accountStatus, a.last_login as lastLogin
      FROM passengers p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN user_accounts a ON u.user_id = a.user_id
      ORDER BY p.passenger_id DESC
    `).all() as any[];
  }

  public updateProfile(passengerId: number, name: string, phoneNo: string): boolean {
    const info = db.prepare(`
      UPDATE passengers SET name = ?, phone_no = ? WHERE passenger_id = ?
    `).run(name, phoneNo, passengerId);
    return info.changes > 0;
  }
}
