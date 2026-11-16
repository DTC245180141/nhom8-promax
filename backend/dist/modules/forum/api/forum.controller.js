"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forumRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_service_1 = require("../../../shared/database/database.service");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
const db = database_service_1.DatabaseService.getInstance().db;
// Lấy danh sách bài thảo luận theo khóa học
router.get('/course/:courseId', auth_middleware_1.authMiddleware, (req, res) => {
    const courseId = req.params.courseId;
    const stmt = db.prepare('SELECT * FROM forum_posts WHERE course_id = ? ORDER BY created_at DESC');
    const posts = stmt.all(courseId);
    const commentCountStmt = db.prepare('SELECT COUNT(*) as cnt FROM forum_comments WHERE post_id = ?');
    const result = posts.map((p) => {
        const comments = commentCountStmt.get(p.id).cnt;
        return { ...p, commentsCount: comments };
    });
    res.json(result);
});
// Xem chi tiết bài thảo luận kèm các bình luận
router.get('/posts/:id', auth_middleware_1.authMiddleware, (req, res) => {
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
router.post('/posts', auth_middleware_1.authMiddleware, (req, res) => {
    const { courseId, title, content } = req.body;
    if (!courseId || !title || !content) {
        res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung thảo luận' });
        return;
    }
    const id = (0, uuid_1.v4)();
    const user = req.user;
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO forum_posts (id, course_id, author_id, author_name, author_role, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, courseId, user.id, user.name, user.role, title, content, createdAt);
    res.status(201).json({ id, courseId, title, content, authorName: user.name, createdAt });
});
// Bình luận vào bài thảo luận
router.post('/posts/:id/comments', auth_middleware_1.authMiddleware, (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
        return;
    }
    const id = (0, uuid_1.v4)();
    const user = req.user;
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO forum_comments (id, post_id, author_id, author_name, author_role, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, postId, user.id, user.name, user.role, content, createdAt);
    res.status(201).json({ id, postId, content, authorName: user.name, createdAt });
});
exports.forumRouter = router;
