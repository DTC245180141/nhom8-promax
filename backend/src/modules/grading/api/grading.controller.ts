import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../shared/database/database.service';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../../../shared/middleware/auth.middleware';
import { InMemoryEventBus } from '../../../shared/events/event-bus';

const router = Router();
const db = DatabaseService.getInstance().db;
const eventBus = InMemoryEventBus.getInstance();

// Lắng nghe sự kiện QuizSubmitted từ module Quiz để tự động ghi điểm
eventBus.subscribe('QuizSubmitted', (event) => {
  const { quizId, studentId, score, submittedAt } = event.payload;
  try {
    const qStmt = db.prepare('SELECT course_id FROM quizzes WHERE id = ?');
    const quiz = qStmt.get(quizId) as any;
    if (!quiz) return;

    const existingStmt = db.prepare('SELECT id FROM grades WHERE student_id = ? AND item_type = ? AND item_id = ?');
    const existing = existingStmt.get(studentId, 'QUIZ', quizId);

    if (existing) {
      const updateStmt = db.prepare('UPDATE grades SET score = ?, graded_at = ? WHERE id = ?');
      updateStmt.run(score, submittedAt, (existing as any).id);
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO grades (id, course_id, student_id, item_type, item_id, score, graded_at)
        VALUES (?, ?, ?, 'QUIZ', ?, ?, ?)
      `);
      insertStmt.run(uuidv4(), quiz.course_id, studentId, quizId, score, submittedAt);
    }
    console.log(`[GradingModule] Tự động cập nhật điểm thi Quiz cho sinh viên ${studentId}: ${score}đ`);
  } catch (err) {
    console.error('[GradingModule] Lỗi khi xử lý sự kiện QuizSubmitted:', err);
  }
});

// Sinh viên xem bảng điểm của mình theo môn học
router.get('/my-grades', authMiddleware, requireRole('STUDENT'), (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user!.id;
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
router.get('/course/:courseId', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
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
router.post('/manual', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { courseId, studentId, itemType, itemId, score, feedback } = req.body;
  if (!courseId || !studentId || !itemType || !itemId || score === undefined) {
    res.status(400).json({ error: 'Thiếu thông tin chấm điểm' });
    return;
  }

  const now = new Date().toISOString();
  const existingStmt = db.prepare('SELECT id FROM grades WHERE student_id = ? AND item_type = ? AND item_id = ?');
  const existing = existingStmt.get(studentId, itemType, itemId) as any;

  if (existing) {
    const updateStmt = db.prepare('UPDATE grades SET score = ?, feedback = ?, graded_at = ? WHERE id = ?');
    updateStmt.run(score, feedback || '', now, existing.id);
    res.json({ message: 'Cập nhật điểm thành công', gradeId: existing.id });
  } else {
    const id = uuidv4();
    const insertStmt = db.prepare(`
      INSERT INTO grades (id, course_id, student_id, item_type, item_id, score, feedback, graded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(id, courseId, studentId, itemType, itemId, score, feedback || '', now);
    res.status(201).json({ message: 'Nhập điểm thành công', gradeId: id });
  }
});

export const gradingRouter = router;
