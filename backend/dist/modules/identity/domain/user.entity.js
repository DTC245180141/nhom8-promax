"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    code;
    name;
    email;
    passwordHash;
    role;
    department;
    createdAt;
    constructor(id, code, name, email, passwordHash, role, department, createdAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.department = department;
        this.createdAt = createdAt;
    }
}
exports.User = User;
