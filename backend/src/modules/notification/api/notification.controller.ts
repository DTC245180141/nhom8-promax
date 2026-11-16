import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../shared/database/database.service';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../../../shared/middleware/auth.middleware';
import { InMemoryEventBus } from '../../../shared/events/event-bus';

const router = Router();
const db = DatabaseService.getInstance().db;
const eventBus = InMemoryEventBus.getInstance();

// Đăng ký nhận sự kiện từ các module khác để tạo thông báo tự động
eventBus.subscribe('AssignmentCreated', (event) => {
  const { assignmentId, courseId, title, deadline } = event.payload;
  try {
    // Tìm tất cả sinh viên trong môn học để gửi thông báo
    const enrollStmt = db.prepare('SELECT student_id FROM enrollments WHERE course_id = ?');
    const enrollments = enrollStmt.all(courseId) as any[];

    const insertStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);

    const now = new Date().toISOString();
    for (const e of enrollments) {
      insertStmt.run(
        uuidv4(),
        e.student_id,
        'Bài tập mới: ' + title,
        `Môn học của bạn có bài tập mới. Hạn nộp: ${deadline}`,
        now
      );
    }
  } catch (err) {
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
    insertStmt.run(
      uuidv4(),
      studentId,
      'Kết quả kiểm tra trực tuyến',
      `Bạn đã hoàn thành bài thi với kết quả: ${score} điểm.`,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('[NotificationModule] Lỗi khi tạo thông báo kết quả thi:', err);
  }
});

// Lấy danh sách thông báo của người dùng hiện tại
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
  res.json(stmt.all(userId));
});

// Đánh dấu đã đọc thông báo
router.put('/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const notifId = req.params.id;
  const userId = req.user!.id;
  const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
  stmt.run(notifId, userId);
  res.json({ message: 'Đã cập nhật trạng thái đã đọc' });
});

// Quản trị viên hoặc Giảng viên phát thông báo chung
router.post('/broadcast', authMiddleware, requireRole('LECTURER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { title, message, courseId } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung thông báo' });
    return;
  }

  const now = new Date().toISOString();
  let targetUserIds: string[] = [];

  if (courseId) {
    const enrollStmt = db.prepare('SELECT student_id FROM enrollments WHERE course_id = ?');
    targetUserIds = (enrollStmt.all(courseId) as any[]).map((e) => e.student_id);
  } else {
    // Toàn hệ thống
    const userStmt = db.prepare('SELECT id FROM users');
    targetUserIds = (userStmt.all() as any[]).map((u) => u.id);
  }

  const insertStmt = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `);

  for (const uid of targetUserIds) {
    insertStmt.run(uuidv4(), uid, title, message, now);
  }

  res.status(201).json({ message: `Đã gửi thông báo tới ${targetUserIds.length} người dùng` });
});

export const notificationRouter = router;
