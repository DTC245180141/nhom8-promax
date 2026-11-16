"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_service_1 = require("../../../shared/database/database.service");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
const db = database_service_1.DatabaseService.getInstance().db;
// Lấy danh sách khóa học của người dùng
router.get('/', auth_middleware_1.authMiddleware, (req, res) => {
    const user = req.user;
    if (user.role === 'LECTURER') {
        const stmt = db.prepare('SELECT * FROM courses WHERE lecturer_id = ?');
        const courses = stmt.all(user.id);
        res.json(courses);
    }
    else if (user.role === 'STUDENT') {
        const stmt = db.prepare(`
      SELECT c.* FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ?
    `);
        const courses = stmt.all(user.id);
        res.json(courses);
    }
    else {
        // ADMIN xem tất cả
        const stmt = db.prepare('SELECT * FROM courses');
        res.json(stmt.all());
    }
});
// Giảng viên tạo lớp học phần mới
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const { code, title, semester } = req.body;
    if (!code || !title) {
        res.status(400).json({ error: 'Thiếu mã môn hoặc tên môn học' });
        return;
    }
    const id = (0, uuid_1.v4)();
    const lecturerId = req.user.id;
    const createdAt = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO courses (id, code, title, lecturer_id, semester, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, code, title, lecturerId, semester || 'HK1-2026', createdAt);
    res.status(201).json({ id, code, title, lecturerId, semester, createdAt });
});
// Lấy chi tiết lớp học kèm danh sách bài giảng
router.get('/:id', auth_middleware_1.authMiddleware, (req, res) => {
    const courseId = req.params.id;
    const courseStmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const course = courseStmt.get(courseId);
    if (!course) {
        res.status(404).json({ error: 'Không tìm thấy môn học' });
        return;
    }
    const lectureStmt = db.prepare('SELECT * FROM lectures WHERE course_id = ? ORDER BY created_at ASC');
    const lectures = lectureStmt.all(courseId);
    res.json({ ...course, lectures });
});
// Giảng viên thêm bài giảng
router.post('/:id/lectures', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const courseId = req.params.id;
    const { title, content, fileUrl } = req.body;
    if (!title) {
        res.status(400).json({ error: 'Thiếu tiêu đề bài giảng' });
        return;
    }
    const id = (0, uuid_1.v4)();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO lectures (id, course_id, title, content, file_url, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, courseId, title, content || '', fileUrl || null, createdAt);
    res.status(201).json({ id, courseId, title, content, fileUrl, createdAt });
});
// Sinh viên đăng ký / Ghi danh vào lớp học
router.post('/:id/enroll', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('STUDENT'), (req, res) => {
    const courseId = req.params.id;
    const studentId = req.user.id;
    try {
        const stmt = db.prepare('INSERT INTO enrollments (id, course_id, student_id, enrolled_at) VALUES (?, ?, ?, ?)');
        stmt.run((0, uuid_1.v4)(), courseId, studentId, new Date().toISOString());
        res.json({ message: 'Ghi danh lớp học phần thành công' });
    }
    catch (err) {
        res.status(400).json({ error: 'Bạn đã đăng ký lớp học phần này rồi' });
    }
});
exports.courseRouter = router;
