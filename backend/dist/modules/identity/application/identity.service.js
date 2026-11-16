"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const user_entity_1 = require("../domain/user.entity");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
class IdentityService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async register(code, name, email, password, role, department) {
        const existing = this.repo.findByEmail(email);
        if (existing) {
            throw new Error('Email này đã được đăng ký');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = new user_entity_1.User((0, uuid_1.v4)(), code, name, email, passwordHash, role, department, new Date());
        this.repo.save(user);
        const token = this.generateToken(user);
        return { token, user: this.sanitize(user) };
    }
    async login(email, password) {
        const user = this.repo.findByEmail(email);
        if (!user) {
            throw new Error('Tài khoản hoặc mật khẩu không chính xác');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Tài khoản hoặc mật khẩu không chính xác');
        }
        const token = this.generateToken(user);
        return { token, user: this.sanitize(user) };
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({
            id: user.id,
            code: user.code,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        }, auth_middleware_1.JWT_SECRET, { expiresIn: '7d' });
    }
    sanitize(user) {
        return {
            id: user.id,
            code: user.code,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        };
    }
}
exports.IdentityService = IdentityService;
