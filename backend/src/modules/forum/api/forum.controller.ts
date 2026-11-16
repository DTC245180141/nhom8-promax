import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../shared/database/database.service';
import { authMiddleware, AuthenticatedRequest } from '../../../shared/middleware/auth.middleware';

const router = Router();
const db = DatabaseService.getInstance().db;

// Lấy danh sách bài thảo luận theo khóa học
router.get('/course/:courseId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const courseId = req.params.courseId;
  const stmt = db.prepare('SELECT * FROM forum_posts WHERE course_id = ? ORDER BY created_at DESC');
  const posts = stmt.all(courseId) as any[];

  const commentCountStmt = db.prepare('SELECT COUNT(*) as cnt FROM forum_comments WHERE post_id = ?');
  const result = posts.map((p) => {
    const comments = (commentCountStmt.get(p.id) as any).cnt;
    return { ...p, commentsCount: comments };
  });

  res.json(result);
});

// Xem chi tiết bài thảo luận kèm các bình luận
router.get('/posts/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const postStmt = db.prepare('SELECT * FROM forum_posts WHERE id = ?');
  const post = postStmt.get(postId);
  if (!post) {
    res.status(404).json({ error: 'Không tìm thấy bài thảo luận' });
    return;
  }

  const commentStmt = db.prepare('SELECT * FROM forum_comments WHERE post_id = ? ORDER BY created_at ASC');
  const comments = commentStmt.all(postId);

  res.json({ ...post, comments });
});

// Đăng bài thảo luận mới
router.post('/posts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { courseId, title, content } = req.body;
  if (!courseId || !title || !content) {
    res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung thảo luận' });
    return;
  }
  const id = uuidv4();
  const user = req.user!;
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO forum_posts (id, course_id, author_id, author_name, author_role, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, courseId, user.id, user.name, user.role, title, content, createdAt);

  res.status(201).json({ id, courseId, title, content, authorName: user.name, createdAt });
});

// Bình luận vào bài thảo luận
router.post('/posts/:id/comments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const postId = req.params.id;
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    return;
  }
  const id = uuidv4();
  const user = req.user!;
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO forum_comments (id, post_id, author_id, author_name, author_role, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, postId, user.id, user.name, user.role, content, createdAt);

  res.status(201).json({ id, postId, content, authorName: user.name, createdAt });
});

export const forumRouter = router;
