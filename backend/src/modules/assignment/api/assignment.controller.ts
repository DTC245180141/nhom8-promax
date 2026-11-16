import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../shared/database/database.service';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../../../shared/middleware/auth.middleware';
import { InMemoryEventBus } from '../../../shared/events/event-bus';

const router = Router();
const db = DatabaseService.getInstance().db;
const eventBus = InMemoryEventBus.getInstance();

// Lấy danh sách bài tập theo khóa học
router.get('/course/:courseId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const courseId = req.params.courseId;
  const stmt = db.prepare('SELECT * FROM assignments WHERE course_id = ? ORDER BY deadline ASC');
  const assignments = stmt.all(courseId) as any[];

  // Nếu là sinh viên, lấy kèm trạng thái nộp bài cá nhân
  if (req.user!.role === 'STUDENT') {
    const subStmt = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?');
    const result = assignments.map((a) => {
      const submission = subStmt.get(a.id, req.user!.id);
      return { ...a, submission };
    });
    res.json(result);
    return;
  }

  res.json(assignments);
});

// Giảng viên tạo bài tập mới
router.post('/', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { courseId, title, description, deadline } = req.body;
  if (!courseId || !title || !deadline) {
    res.status(400).json({ error: 'Thiếu thông tin bài tập' });
    return;
  }
  const id = uuidv4();
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
router.post('/:id/submit', authMiddleware, requireRole('STUDENT'), (req: AuthenticatedRequest, res: Response) => {
  const assignmentId = req.params.id;
  const studentId = req.user!.id;
  const { fileUrl, submittedText } = req.body;

  const now = new Date().toISOString();
  const existingStmt = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?');
  const existing = existingStmt.get(assignmentId, studentId) as any;

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
  } else {
    // Thêm mới bài nộp
    const subId = uuidv4();
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
router.get('/:id/submissions', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
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

export const assignmentRouter = router;
