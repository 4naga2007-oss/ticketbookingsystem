import { db } from '../config/database';
import { UserAccount } from '../types/domain';

export class UserAccountRepository {
  public create(userId: number, status: 'Active' | 'Inactive' | 'Suspended' = 'Active'): UserAccount {
    const stmt = db.prepare(`
      INSERT INTO user_accounts (user_id, account_status, last_login)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    const info = stmt.run(userId, status);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  public findById(accountId: number): UserAccount | null {
    const row = db.prepare(`
      SELECT account_id as accountId, user_id as userId, account_status as accountStatus, last_login as lastLogin
      FROM user_accounts WHERE account_id = ?
    `).get(accountId) as UserAccount | undefined;
    return row || null;
  }

  public findByUserId(userId: number): UserAccount | null {
    const row = db.prepare(`
      SELECT account_id as accountId, user_id as userId, account_status as accountStatus, last_login as lastLogin
      FROM user_accounts WHERE user_id = ?
    `).get(userId) as UserAccount | undefined;
    return row || null;
  }

  public updateStatus(userId: number, status: 'Active' | 'Inactive' | 'Suspended'): boolean {
    const info = db.prepare(`
      UPDATE user_accounts SET account_status = ? WHERE user_id = ?
    `).run(status, userId);
    return info.changes > 0;
  }

  public updateLastLogin(userId: number): void {
    db.prepare(`
      UPDATE user_accounts SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?
    `).run(userId);
  }
}
