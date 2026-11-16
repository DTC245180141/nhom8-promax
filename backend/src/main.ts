import express from 'express';
import cors from 'cors';
import { DatabaseService } from './shared/database/database.service';
import { identityRouter } from './modules/identity/api/identity.controller';
import { courseRouter } from './modules/course/api/course.controller';
import { assignmentRouter } from './modules/assignment/api/assignment.controller';
import { quizRouter } from './modules/quiz/api/quiz.controller';
import { gradingRouter } from './modules/grading/api/grading.controller';
import { forumRouter } from './modules/forum/api/forum.controller';
import { notificationRouter } from './modules/notification/api/notification.controller';
import { seedDatabase } from './shared/database/seed';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint cho IT Ops / Docker
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      architecture: 'Modular Monolith (Ready for Evolution)',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers theo từng Bounded Context độc lập
  app.use('/api/auth', identityRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/assignments', assignmentRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/grades', gradingRouter);
  app.use('/api/forum', forumRouter);
  app.use('/api/notifications', notificationRouter);

  return app;
}

if (require.main === module) {
  DatabaseService.getInstance();
  seedDatabase();

  const app = createApp();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 U-LMS Backend Server running on http://localhost:${PORT}`);
    console.log(`📦 Architecture: Clean Architecture + Modular Monolith`);
    console.log(`🎓 Ready to serve 2,000 -> 30,000 students!`);
    console.log(`=======================================================`);
  });
}
