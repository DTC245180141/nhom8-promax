"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradingRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_service_1 = require("../../../shared/database/database.service");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const event_bus_1 = require("../../../shared/events/event-bus");
const router = (0, express_1.Router)();
const db = database_service_1.DatabaseService.getInstance().db;
const eventBus = event_bus_1.InMemoryEventBus.getInstance();
// Lắng nghe sự kiện QuizSubmitted từ module Quiz để tự động ghi điểm
eventBus.subscribe('QuizSubmitted', (event) => {
    const { quizId, studentId, score, submittedAt } = event.payload;
    try {
        const qStmt = db.prepare('SELECT course_id FROM quizzes WHERE id = ?');
        const quiz = qStmt.get(quizId);
        if (!quiz)
            return;
        const existingStmt = db.prepare('SELECT id FROM grades WHERE student_id = ? AND item_type = ? AND item_id = ?');
        const existing = existingStmt.get(studentId, 'QUIZ', quizId);
        if (existing) {
            const updateStmt = db.prepare('UPDATE grades SET score = ?, graded_at = ? WHERE id = ?');
            updateStmt.run(score, submittedAt, existing.id);
        }
        else {
            const insertStmt = db.prepare(`
        INSERT INTO grades (id, course_id, student_id, item_type, item_id, score, graded_at)
        VALUES (?, ?, ?, 'QUIZ', ?, ?, ?)
      `);
            insertStmt.run((0, uuid_1.v4)(), quiz.course_id, studentId, quizId, score, submittedAt);
        }
        console.log(`[GradingModule] Tự động cập nhật điểm thi Quiz cho sinh viên ${studentId}: ${score}đ`);
    }
    catch (err) {
        console.error('[GradingModule] Lỗi khi xử lý sự kiện QuizSubmitted:', err);
    }
});
// Sinh viên xem bảng điểm của mình theo môn học
router.get('/my-grades', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('STUDENT'), (req, res) => {
    const studentId = req.user.id;
    const stmt = db.prepare(`
    SELECT g.*, c.code as course_code, c.title as course_title
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = ?
    ORDER BY g.graded_at DESC
  `);
    res.json(stmt.all(studentId));
});
// Giảng viên xem toàn bộ bảng điểm của một lớp học phần
router.get('/course/:courseId', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const courseId = req.params.courseId;
    const stmt = db.prepare(`
    SELECT g.*, u.name as student_name, u.code as student_code
    FROM grades g
    JOIN users u ON g.student_id = u.id
    WHERE g.course_id = ?
    ORDER BY u.code ASC
  `);
    res.json(stmt.all(courseId));
});
// Giảng viên nhập/sửa điểm bài tập tự luận
router.post('/manual', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const { courseId, studentId, itemType, itemId, score, feedback } = req.body;
    if (!courseId || !studentId || !itemType || !itemId || score === undefined) {
        res.status(400).json({ error: 'Thiếu thông tin chấm điểm' });
        return;
    }
    const now = new Date().toISOString();
    const existingStmt = db.prepare('SELECT id FROM grades WHERE student_id = ? AND item_type = ? AND item_id = ?');
    const existing = existingStmt.get(studentId, itemType, itemId);
    if (existing) {
        const updateStmt = db.prepare('UPDATE grades SET score = ?, feedback = ?, graded_at = ? WHERE id = ?');
        updateStmt.run(score, feedback || '', now, existing.id);
        res.json({ message: 'Cập nhật điểm thành công', gradeId: existing.id });
    }
    else {
        const id = (0, uuid_1.v4)();
        const insertStmt = db.prepare(`
      INSERT INTO grades (id, course_id, student_id, item_type, item_id, score, feedback, graded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertStmt.run(id, courseId, studentId, itemType, itemId, score, feedback || '', now);
        res.status(201).json({ message: 'Nhập điểm thành công', gradeId: id });
    }
});
exports.gradingRouter = router;
