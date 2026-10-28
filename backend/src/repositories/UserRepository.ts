import { db } from '../config/database';
import { User } from '../types/domain';

export class UserRepository {
  public create(user: Omit<User, 'userId' | 'createdAt'>): User {
    const stmt = db.prepare(`
      INSERT INTO users (user_name, email, password, role)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(user.userName, user.email, user.password, user.role);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(userId: number): User | null {
    const row = db.prepare(`
      SELECT user_id as userId, user_name as userName, email, password, role, created_at as createdAt
      FROM users WHERE user_id = ?
    `).get(userId) as User | undefined;
    return row || null;
  }

  public findByEmail(email: string): User | null {
    const row = db.prepare(`
      SELECT user_id as userId, user_name as userName, email, password, role, created_at as createdAt
      FROM users WHERE email = ?
    `).get(email) as User | undefined;
    return row || null;
  }

  public findByUsername(userName: string): User | null {
    const row = db.prepare(`
      SELECT user_id as userId, user_name as userName, email, password, role, created_at as createdAt
      FROM users WHERE user_name = ?
    `).get(userName) as User | undefined;
    return row || null;
  }

  public findAll(): User[] {
    return db.prepare(`
      SELECT user_id as userId, user_name as userName, email, role, created_at as createdAt
      FROM users ORDER BY user_id DESC
    `).all() as User[];
  }

  public updatePassword(userId: number, newPasswordHash: string): boolean {
    const info = db.prepare(`
      UPDATE users SET password = ? WHERE user_id = ?
    `).run(newPasswordHash, userId);
    return info.changes > 0;
  }

  public delete(userId: number): boolean {
    const info = db.prepare('DELETE FROM users WHERE user_id = ?').run(userId);
    return info.changes > 0;
  }
}
