import { db } from '../config/database';
import { Admin } from '../types/domain';

export class AdminRepository {
  public create(userId: number, name: string): Admin {
    const stmt = db.prepare(`
      INSERT INTO admins (user_id, name, role)
      VALUES (?, ?, 'ADMIN')
    `);
    const info = stmt.run(userId, name);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(adminId: number): Admin | null {
    const row = db.prepare(`
      SELECT a.admin_id as adminId, a.user_id as userId, a.name, a.role,
             u.user_name as userName, u.email, u.created_at as createdAt
      FROM admins a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.admin_id = ?
    `).get(adminId) as Admin | undefined;
    return row || null;
  }

  public findByUserId(userId: number): Admin | null {
    const row = db.prepare(`
      SELECT a.admin_id as adminId, a.user_id as userId, a.name, a.role,
             u.user_name as userName, u.email, u.created_at as createdAt
      FROM admins a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.user_id = ?
    `).get(userId) as Admin | undefined;
    return row || null;
  }
}
