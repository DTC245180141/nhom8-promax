import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../shared/database/database.service';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../../../shared/middleware/auth.middleware';

const router = Router();
const db = DatabaseService.getInstance().db;

// Lấy danh sách khóa học của người dùng
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role === 'LECTURER') {
    const stmt = db.prepare('SELECT * FROM courses WHERE lecturer_id = ?');
    const courses = stmt.all(user.id);
    res.json(courses);
  } else if (user.role === 'STUDENT') {
    const stmt = db.prepare(`
      SELECT c.* FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ?
    `);
    const courses = stmt.all(user.id);
    res.json(courses);
  } else {
    // ADMIN xem tất cả
    const stmt = db.prepare('SELECT * FROM courses');
    res.json(stmt.all());
  }
});

// Giảng viên tạo lớp học phần mới
router.post('/', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { code, title, semester } = req.body;
  if (!code || !title) {
    res.status(400).json({ error: 'Thiếu mã môn hoặc tên môn học' });
    return;
  }
  const id = uuidv4();
  const lecturerId = req.user!.id;
  const createdAt = new Date().toISOString();

  const stmt = db.prepare('INSERT INTO courses (id, code, title, lecturer_id, semester, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, code, title, lecturerId, semester || 'HK1-2026', createdAt);

  res.status(201).json({ id, code, title, lecturerId, semester, createdAt });
});

// Lấy chi tiết lớp học kèm danh sách bài giảng
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
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
router.post('/:id/lectures', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const courseId = req.params.id;
  const { title, content, fileUrl } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Thiếu tiêu đề bài giảng' });
    return;
  }
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare('INSERT INTO lectures (id, course_id, title, content, file_url, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, courseId, title, content || '', fileUrl || null, createdAt);

  res.status(201).json({ id, courseId, title, content, fileUrl, createdAt });
});

// Sinh viên đăng ký / Ghi danh vào lớp học
router.post('/:id/enroll', authMiddleware, requireRole('STUDENT'), (req: AuthenticatedRequest, res: Response) => {
  const courseId = req.params.id;
  const studentId = req.user!.id;
  try {
    const stmt = db.prepare('INSERT INTO enrollments (id, course_id, student_id, enrolled_at) VALUES (?, ?, ?, ?)');
    stmt.run(uuidv4(), courseId, studentId, new Date().toISOString());
    res.json({ message: 'Ghi danh lớp học phần thành công' });
  } catch (err: any) {
    res.status(400).json({ error: 'Bạn đã đăng ký lớp học phần này rồi' });
  }
});

export const courseRouter = router;
