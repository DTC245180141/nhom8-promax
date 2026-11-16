"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_service_1 = require("../../../shared/database/database.service");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const event_bus_1 = require("../../../shared/events/event-bus");
const router = (0, express_1.Router)();
const db = database_service_1.DatabaseService.getInstance().db;
const eventBus = event_bus_1.InMemoryEventBus.getInstance();
// Lấy danh sách bài tập theo khóa học
router.get('/course/:courseId', auth_middleware_1.authMiddleware, (req, res) => {
    const courseId = req.params.courseId;
    const stmt = db.prepare('SELECT * FROM assignments WHERE course_id = ? ORDER BY deadline ASC');
    const assignments = stmt.all(courseId);
    // Nếu là sinh viên, lấy kèm trạng thái nộp bài cá nhân
    if (req.user.role === 'STUDENT') {
        const subStmt = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?');
        const result = assignments.map((a) => {
            const submission = subStmt.get(a.id, req.user.id);
            return { ...a, submission };
        });
        res.json(result);
        return;
    }
    res.json(assignments);
});
// Giảng viên tạo bài tập mới
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const { courseId, title, description, deadline } = req.body;
    if (!courseId || !title || !deadline) {
        res.status(400).json({ error: 'Thiếu thông tin bài tập' });
        return;
    }
    const id = (0, uuid_1.v4)();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO assignments (id, course_id, title, description, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, courseId, title, description || '', deadline, createdAt);
    // Bắn Domain Event thông báo bài tập mới
    eventBus.publish({
        eventName: 'AssignmentCreated',
        occurredOn: new Date(),
        payload: { assignmentId: id, courseId, title, deadline },
    });
    res.status(201).json({ id, courseId, title, description, deadline, createdAt });
});
// Sinh viên nộp bài tập (Có xử lý Idempotency & Versioning chống tranh chấp)
router.post('/:id/submit', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('STUDENT'), (req, res) => {
    const assignmentId = req.params.id;
    const studentId = req.user.id;
    const { fileUrl, submittedText } = req.body;
    const now = new Date().toISOString();
    const existingStmt = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?');
    const existing = existingStmt.get(assignmentId, studentId);
    if (existing) {
        // Cập nhật với optimistic locking qua version
        const newVersion = existing.version + 1;
        const updateStmt = db.prepare(`
      UPDATE submissions
      SET file_url = ?, submitted_text = ?, submitted_at = ?, status = 'SUBMITTED', version = ?
      WHERE id = ? AND version = ?
    `);
        const info = updateStmt.run(fileUrl || null, submittedText || '', now, newVersion, existing.id, existing.version);
        if (info.changes === 0) {
            res.status(409).json({ error: 'Tranh chấp đồng thời: Phiên nộp bài đã được cập nhật từ thiết bị khác. Vui lòng thử lại.' });
            return;
        }
        res.json({ message: 'Cập nhật bài nộp thành công', submissionId: existing.id, version: newVersion });
    }
    else {
        // Thêm mới bài nộp
        const subId = (0, uuid_1.v4)();
        const insertStmt = db.prepare(`
      INSERT INTO submissions (id, assignment_id, student_id, file_url, submitted_text, submitted_at, status, version)
      VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', 1)
    `);
        insertStmt.run(subId, assignmentId, studentId, fileUrl || null, submittedText || '', now);
        eventBus.publish({
            eventName: 'AssignmentSubmitted',
            occurredOn: new Date(),
            payload: { submissionId: subId, assignmentId, studentId, submittedAt: now },
        });
        res.status(201).json({ message: 'Nộp bài tập thành công', submissionId: subId, version: 1 });
    }
});
// Giảng viên xem danh sách bài nộp của sinh viên
router.get('/:id/submissions', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const assignmentId = req.params.id;
    const stmt = db.prepare(`
    SELECT s.*, u.name as student_name, u.code as student_code
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.assignment_id = ?
    ORDER BY s.submitted_at DESC
  `);
    const submissions = stmt.all(assignmentId);
    res.json(submissions);
});
exports.assignmentRouter = router;
