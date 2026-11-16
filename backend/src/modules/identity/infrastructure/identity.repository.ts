import { DatabaseService } from '../../../shared/database/database.service';
import { User } from '../domain/user.entity';

export class IdentityRepository {
  private db = DatabaseService.getInstance().db;

  public findByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as any;
    if (!row) return null;
    return new User(
      row.id,
      row.code,
      row.name,
      row.email,
      row.password_hash,
      row.role,
      row.department,
      new Date(row.created_at)
    );
  }

  public findById(id: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return new User(
      row.id,
      row.code,
      row.name,
      row.email,
      row.password_hash,
      row.role,
      row.department,
      new Date(row.created_at)
    );
  }

  public save(user: User): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, code, name, email, password_hash, role, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user.id,
      user.code,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      user.department,
      user.createdAt.toISOString()
    );
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as cnt FROM users');
    return (stmt.get() as any).cnt;
  }
}
