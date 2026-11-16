"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identityRouter = void 0;
const express_1 = require("express");
const identity_service_1 = require("../application/identity.service");
const identity_repository_1 = require("../infrastructure/identity.repository");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
const repo = new identity_repository_1.IdentityRepository();
const service = new identity_service_1.IdentityService(repo);
router.post('/register', async (req, res) => {
    try {
        const { code, name, email, password, role, department } = req.body;
        if (!code || !name || !email || !password || !role) {
            res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin' });
            return;
        }
        const result = await service.register(code, name, email, password, role, department || 'Khoa CNTT');
        res.status(201).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
            return;
        }
        const result = await service.login(email, password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
});
router.get('/me', auth_middleware_1.authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
exports.identityRouter = router;
