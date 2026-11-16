import request from 'supertest';
import { createApp } from '../src/main';
import { DatabaseService } from '../src/shared/database/database.service';
import { seedDatabase } from '../src/shared/database/seed';

describe('U-LMS Modular Architecture & Core Flow Tests', () => {
  let app: any;
  let studentToken: string;
  let lecturerToken: string;

  beforeAll(() => {
    DatabaseService.getInstance();
    seedDatabase();
    app = createApp();
  });

  it('1. Health check endpoint - Sẵn sàng tiến hóa', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.architecture).toContain('Modular Monolith');
  });

  it('2. Identity Module - Giảng viên đăng nhập thành công', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'giangvien@ulms.edu.vn',
      password: '123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('LECTURER');
    lecturerToken = res.body.token;
  });

  it('3. Identity Module - Sinh viên đăng nhập thành công', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'sinhvien1@ulms.edu.vn',
      password: '123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('STUDENT');
    studentToken = res.body.token;
  });

  it('4. Course Module - Lấy danh sách khóa học của sinh viên', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].code).toBe('IT401');
  });

  it('5. Quiz & Concurrency Module - Sinh viên làm bài và nộp bài thi trắc nghiệm', async () => {
    // Lấy bài kiểm tra
    const coursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`);
    const courseId = coursesRes.body[0].id;

    const quizListRes = await request(app)
      .get(`/api/quizzes/course/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(quizListRes.status).toBe(200);
    const quiz = quizListRes.body[0];

    // Lấy đề thi
    const takeRes = await request(app)
      .get(`/api/quizzes/${quiz.id}/take`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(takeRes.status).toBe(200);
    expect(takeRes.body.questions.length).toBeGreaterThan(0);

    // Chuẩn bị câu trả lời
    const answers: any = {};
    for (const q of takeRes.body.questions) {
      answers[q.id] = 0; // Chọn đáp án
    }

    // Nộp bài thi
    const submitRes = await request(app)
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.message).toContain('thành công');
    expect(typeof submitRes.body.score).toBe('number');
  });

  it('6. Grading Module - Bảng điểm tự động đồng bộ qua Event Bus', async () => {
    const res = await request(app)
      .get('/api/grades/my-grades')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].item_type).toBe('QUIZ');
  });
});
