"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_service_1 = require("../../../shared/database/database.service");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const event_bus_1 = require("../../../shared/events/event-bus");
const router = (0, express_1.Router)();
const db = database_service_1.DatabaseService.getInstance().db;
const eventBus = event_bus_1.InMemoryEventBus.getInstance();
// Lấy danh sách bài kiểm tra theo khóa học
router.get('/course/:courseId', auth_middleware_1.authMiddleware, (req, res) => {
    const courseId = req.params.courseId;
    const stmt = db.prepare('SELECT id, course_id, title, duration_minutes, is_published, created_at FROM quizzes WHERE course_id = ?');
    const quizzes = stmt.all(courseId);
    // Nếu là sinh viên, kiểm tra đã nộp/làm bài chưa
    if (req.user.role === 'STUDENT') {
        const attemptStmt = db.prepare('SELECT id, score, started_at, submitted_at, status FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?');
        const result = quizzes.map((q) => {
            const attempt = attemptStmt.get(q.id, req.user.id);
            return { ...q, attempt };
        });
        res.json(result);
        return;
    }
    res.json(quizzes);
});
// Giảng viên tạo đề kiểm tra và câu hỏi
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('LECTURER', 'ADMIN'), (req, res) => {
    const { courseId, title, durationMinutes, questions } = req.body;
    if (!courseId || !title || !durationMinutes || !Array.isArray(questions)) {
        res.status(400).json({ error: 'Thiếu thông tin bài kiểm tra hoặc danh sách câu hỏi' });
        return;
    }
    const quizId = (0, uuid_1.v4)();
    const createdAt = new Date().toISOString();
    // Bắt đầu Transaction
    db.exec('BEGIN TRANSACTION;');
    try {
        const qStmt = db.prepare('INSERT INTO quizzes (id, course_id, title, duration_minutes, created_at) VALUES (?, ?, ?, ?, ?)');
        qStmt.run(quizId, courseId, title, durationMinutes, createdAt);
        const questionStmt = db.prepare(`
      INSERT INTO questions (id, quiz_id, content, options_json, correct_option_index)
      VALUES (?, ?, ?, ?, ?)
    `);
        for (const q of questions) {
            questionStmt.run((0, uuid_1.v4)(), quizId, q.content, JSON.stringify(q.options), q.correctOptionIndex);
        }
        db.exec('COMMIT;');
        res.status(201).json({ id: quizId, courseId, title, durationMinutes, questionCount: questions.length, createdAt });
    }
    catch (error) {
        db.exec('ROLLBACK;');
        res.status(500).json({ error: 'Lỗi khi tạo đề kiểm tra: ' + error.message });
    }
});
// Sinh viên lấy đề kiểm tra để làm (Ẩn đáp án đúng)
router.get('/:id/take', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('STUDENT'), (req, res) => {
    const quizId = req.params.id;
    const studentId = req.user.id;
    const quizStmt = db.prepare('SELECT * FROM quizzes WHERE id = ?');
    const quiz = quizStmt.get(quizId);
    if (!quiz) {
        res.status(404).json({ error: 'Không tìm thấy bài kiểm tra' });
        return;
    }
    // Kiểm tra attempt đã submit chưa
    const attemptStmt = db.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?');
    const existingAttempt = attemptStmt.get(quizId, studentId);
    if (existingAttempt && existingAttempt.status === 'SUBMITTED') {
        res.status(400).json({ error: 'Bạn đã hoàn thành bài thi này rồi', score: existingAttempt.score });
        return;
    }
    // Khởi tạo attempt nếu chưa có
    if (!existingAttempt) {
        const insertAttempt = db.prepare(`
      INSERT INTO quiz_attempts (id, quiz_id, student_id, answers_json, started_at, status, version)
      VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', 1)
    `);
        insertAttempt.run((0, uuid_1.v4)(), quizId, studentId, JSON.stringify({}), new Date().toISOString());
    }
    // Lấy câu hỏi và ẩn correct_option_index
    const qStmt = db.prepare('SELECT id, content, options_json FROM questions WHERE quiz_id = ?');
    const questions = qStmt.all(quizId).map((q) => ({
        id: q.id,
        content: q.content,
        options: JSON.parse(q.options_json),
    }));
    res.json({
        quiz: {
            id: quiz.id,
            title: quiz.title,
            durationMinutes: quiz.duration_minutes,
        },
        questions,
    });
});
// Sinh viên nộp bài thi trắc nghiệm (Chấm điểm tự động & Xử lý đồng thời cao điểm)
router.post('/:id/submit', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)('STUDENT'), (req, res) => {
    const quizId = req.params.id;
    const studentId = req.user.id;
    const { answers } = req.body; // Map: { [questionId: string]: number }
    const attemptStmt = db.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?');
    const attempt = attemptStmt.get(quizId, studentId);
    if (!attempt) {
        res.status(404).json({ error: 'Không tìm thấy phiên làm bài của bạn' });
        return;
    }
    if (attempt.status === 'SUBMITTED') {
        res.status(400).json({ error: 'Bài thi đã được nộp trước đó', score: attempt.score });
        return;
    }
    // Tính điểm tự động
    const qStmt = db.prepare('SELECT id, correct_option_index FROM questions WHERE quiz_id = ?');
    const questions = qStmt.all(quizId);
    let correctCount = 0;
    for (const q of questions) {
        const studentChoice = answers?.[q.id];
        if (studentChoice !== undefined && studentChoice === q.correct_option_index) {
            correctCount++;
        }
    }
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 10).toFixed(2)) : 0;
    const submittedAt = new Date().toISOString();
    // Cập nhật với Optimistic Concurrency Control (Version check)
    const updateStmt = db.prepare(`
    UPDATE quiz_attempts
    SET answers_json = ?, score = ?, submitted_at = ?, status = 'SUBMITTED', version = version + 1
    WHERE id = ? AND version = ?
  `);
    const info = updateStmt.run(JSON.stringify(answers || {}), score, submittedAt, attempt.id, attempt.version);
    if (info.changes === 0) {
        res.status(409).json({ error: 'Xung đột phiên làm bài: Dữ liệu đã thay đổi. Vui lòng kiểm tra lại.' });
        return;
    }
    // Bắn Domain Event để phân hệ Grading và Notification đồng bộ
    eventBus.publish({
        eventName: 'QuizSubmitted',
        occurredOn: new Date(),
        payload: { quizId, studentId, score, submittedAt },
    });
    res.json({
        message: 'Nộp bài thi thành công',
        score,
        correctCount,
        totalQuestions,
        submittedAt,
    });
});
exports.quizRouter = router;
