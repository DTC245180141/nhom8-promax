"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_service_1 = require("../../../shared/database/database.service");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const event_bus_1 = require("../../../shared/events/event-bus");
const router = (0, express_1.Router)();
const db = database_service_1.DatabaseService.getInstance().db;
const eventBus = event_bus_1.InMemoryEventBus.getInstance();
// Đăng ký nhận sự kiện từ các module khác để tạo thông báo tự động
eventBus.subscribe('AssignmentCreated', (event) => {
    const { assignmentId, courseId, title, deadline } = event.payload;
    try {
        // Tìm tất cả sinh viên trong môn học để gửi thông báo
        const enrollStmt = db.prepare('SELECT student_id FROM enrollments WHERE course_id = ?');
        const enrollments = enrollStmt.all(courseId);
        const insertStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
        const now = new Date().toISOString();
        for (const e of enrollments) {
            insertStmt.run((0, uuid_1.v4)(), e.student_id, 'Bài tập mới: ' + title, `Môn học của bạn có bài tập mới. Hạn nộp: ${deadline}`, now);
        }
    }
    catch (err) {
        console.error('[NotificationModule] Lỗi khi tạo thông báo bài tập mới:', err);
    }
});
eventBus.subscribe('QuizSubmitted', (event) => {
    const { studentId, score } = event.payload;
    try {
        const insertStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
        insertStmt.run((0, uuid_1.v4)(), studentId, 'Kết quả kiểm tra trực tuyến', `Bạn đã hoàn thành bài thi với kết quả: ${score} điểm.`, new Date().toISOString());
    }
    catch (err) {
        console.error('[NotificationModule] Lỗi khi tạo thông báo kết quả thi:', err);
    }
});
// Lấy danh sách thông báo của người dùng hiện tại
router.get('/', auth_middleware_1.authMiddleware, (req, res) => {
    const userId = req.user.id;
    const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
    res.json(stmt.all(userId));
});
// Đánh dấu đã đọc thông báo
router.put('/:id/read', auth_middleware_1.authMiddleware, (req, res) => {
    const notifId = req.params.id;
    const userId = req.user.id;
    const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
    stmt.run(notifId, userId);
    res.json({ message: 'Đã cập nhật trạng thái đã đọc' });
});
// Quản trị viên hoặc Giảng viên phát thông báo chung
router.post('/broadcast', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const { title, message, courseId } = req.body;
    if (!title || !message) {
        res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung thông báo' });
        return;
    }
    const now = new Date().toISOString();
    let targetUserIds = [];
    if (courseId) {
        const enrollStmt = db.prepare('SELECT student_id FROM enrollments WHERE course_id = ?');
        targetUserIds = enrollStmt.all(courseId).map((e) => e.student_id);
    }
    else {
        // Toàn hệ thống
        const userStmt = db.prepare('SELECT id FROM users');
        targetUserIds = userStmt.all().map((u) => u.id);
    }
    const insertStmt = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `);
    for (const uid of targetUserIds) {
        insertStmt.run((0, uuid_1.v4)(), uid, title, message, now);
    }
    res.status(201).json({ message: `Đã gửi thông báo tới ${targetUserIds.length} người dùng` });
});
exports.notificationRouter = router;
