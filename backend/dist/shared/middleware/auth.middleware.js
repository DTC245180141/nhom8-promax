"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_SECRET = process.env.JWT_SECRET || 'ulms_super_secret_jwt_key_2026';
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Thiếu token xác thực' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Unauthorized: Token không hợp lệ hoặc đã hết hạn' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden: Bạn không có quyền thực hiện thao tác này' });
            return;
        }
        next();
    };
}
