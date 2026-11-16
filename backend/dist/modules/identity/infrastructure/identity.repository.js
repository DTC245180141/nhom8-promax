"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityRepository = void 0;
const database_service_1 = require("../../../shared/database/database.service");
const user_entity_1 = require("../domain/user.entity");
class IdentityRepository {
    db = database_service_1.DatabaseService.getInstance().db;
    findByEmail(email) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
        const row = stmt.get(email);
        if (!row)
            return null;
        return new user_entity_1.User(row.id, row.code, row.name, row.email, row.password_hash, row.role, row.department, new Date(row.created_at));
    }
    findById(id) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return new user_entity_1.User(row.id, row.code, row.name, row.email, row.password_hash, row.role, row.department, new Date(row.created_at));
    }
    save(user) {
        const stmt = this.db.prepare(`
      INSERT INTO users (id, code, name, email, password_hash, role, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(user.id, user.code, user.name, user.email, user.passwordHash, user.role, user.department, user.createdAt.toISOString());
    }
    count() {
        const stmt = this.db.prepare('SELECT COUNT(*) as cnt FROM users');
        return stmt.get().cnt;
    }
}
exports.IdentityRepository = IdentityRepository;
