import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './database.service';

export function seedDatabase(): void {
  const db = DatabaseService.getInstance().db;

  const userCountStmt = db.prepare('SELECT COUNT(*) as cnt FROM users');
  const count = (userCountStmt.get() as any).cnt;

  if (count > 0) {
    return; // Đã có dữ liệu
  }

  console.log('[Seed] Đang tạo dữ liệu mẫu khởi tạo cho U-LMS...');

  const passHash = bcrypt.hashSync('123456', 10);
  const now = new Date().toISOString();

  // 1. Tạo Giảng viên và Sinh viên mẫu
  const lecturerId = uuidv4();
  const student1Id = uuidv4();
  const student2Id = uuidv4();
  const adminId = uuidv4();

  const userStmt = db.prepare(`
    INSERT INTO users (id, code, name, email, password_hash, role, department, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  userStmt.run(adminId, 'ADMIN001', 'Quản trị viên IT', 'admin@ulms.edu.vn', passHash, 'ADMIN', 'Phòng CNTT', now);
  userStmt.run(lecturerId, 'GV001', 'TS. Nguyễn Văn A', 'giangvien@ulms.edu.vn', passHash, 'LECTURER', 'Khoa CNTT', now);
  userStmt.run(student1Id, 'SV001', 'Trần Thị Mai', 'sinhvien1@ulms.edu.vn', passHash, 'STUDENT', 'Khoa CNTT', now);
  userStmt.run(student2Id, 'SV002', 'Lê Hoàng Nam', 'sinhvien2@ulms.edu.vn', passHash, 'STUDENT', 'Khoa CNTT', now);

  // 2. Tạo Môn học mẫu: Kiến trúc Phần mềm
  const courseId = uuidv4();
  const courseStmt = db.prepare(`
    INSERT INTO courses (id, code, title, lecturer_id, semester, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  courseStmt.run(courseId, 'IT401', 'Kiến trúc Phần mềm Tiên tiến', lecturerId, 'HK1-2026', now);

  // 3. Ghi danh sinh viên vào môn học
  const enrollStmt = db.prepare('INSERT INTO enrollments (id, course_id, student_id, enrolled_at) VALUES (?, ?, ?, ?)');
  enrollStmt.run(uuidv4(), courseId, student1Id, now);
  enrollStmt.run(uuidv4(), courseId, student2Id, now);

  // 4. Tạo Bài giảng mẫu
  const lectureStmt = db.prepare(`
    INSERT INTO lectures (id, course_id, title, content, file_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  lectureStmt.run(
    uuidv4(),
    courseId,
    'Chương 1: Giới thiệu Kiến trúc & Thuộc tính Chất lượng (NFRs & QAS)',
    'Nội dung bài giảng về các thuộc tính chất lượng, kịch bản chất lượng chuẩn SEI và kiến trúc tiến hóa.',
    'https://ulms.edu.vn/materials/chuong1-nfrs.pdf',
    now
  );
  lectureStmt.run(
    uuidv4(),
    courseId,
    'Chương 2: Mô hình 4+1 Views & Phân tích Đánh đổi Kiến trúc',
    'Tìm hiểu về Logical, Process, Development, Physical view và kịch bản thực thi.',
    'https://ulms.edu.vn/materials/chuong2-4plus1.pdf',
    now
  );

  // 5. Tạo Bài tập mẫu
  const assignmentId = uuidv4();
  const assignStmt = db.prepare(`
    INSERT INTO assignments (id, course_id, title, description, deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  assignStmt.run(
    assignmentId,
    courseId,
    'Bài tập lớn KTKN 1 & KTKN 2: Thiết kế Kiến trúc U-LMS',
    'Nộp tài liệu đặc tả NFRs, QAS và bản vẽ mô hình 4+1 Views cho hệ thống LMS trường đại học.',
    '2026-12-31T23:59:59Z',
    now
  );

  // 6. Tạo Đề kiểm tra trắc nghiệm mẫu
  const quizId = uuidv4();
  const quizStmt = db.prepare(`
    INSERT INTO quizzes (id, course_id, title, duration_minutes, is_published, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  quizStmt.run(quizId, courseId, 'Kiểm tra trắc nghiệm giữa kỳ: Nguyên lý Kiến trúc phần mềm', 15, now);

  const qStmt = db.prepare(`
    INSERT INTO questions (id, quiz_id, content, options_json, correct_option_index)
    VALUES (?, ?, ?, ?, ?)
  `);

  qStmt.run(
    uuidv4(),
    quizId,
    'Mô hình 4+1 Views của Kruchten bao gồm những khung nhìn nào?',
    JSON.stringify([
      'Logical, Process, Development, Physical, Scenarios',
      'Class, Sequence, Component, Deployment, Use Case',
      'Frontend, Backend, Database, Cloud, Network',
      'Agile, Waterfall, Scrum, Kanban, DevOps',
    ]),
    0
  );

  qStmt.run(
    quizId,
    quizId,
    'Trong kịch bản chất lượng (QAS) chuẩn SEI, yếu tố nào xác định con số định lượng kiểm chứng?',
    JSON.stringify(['Source', 'Environment', 'Response Measure', 'Artifact']),
    2
  );

  qStmt.run(
    uuidv4(),
    quizId,
    'Tại sao nên chọn Modular Monolith thay vì Microservices ngay từ ngày đầu cho quy mô 2.000 sinh viên?',
    JSON.stringify([
      'Vì Microservices không bao giờ scale được',
      'Để tối ưu chi phí hạ tầng, giảm độ trễ mạng và đơn giản hóa giao dịch ACID trong khi vẫn giữ ranh giới module rõ ràng để tiến hóa',
      'Vì trường đại học không cho phép dùng Docker',
      'Vì không thể kết nối mạng nhiều máy chủ',
    ]),
    1
  );

  // 7. Tạo Bài thảo luận trên diễn đàn
  const forumStmt = db.prepare(`
    INSERT INTO forum_posts (id, course_id, author_id, author_name, author_role, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  forumStmt.run(
    uuidv4(),
    courseId,
    lecturerId,
    'TS. Nguyễn Văn A',
    'LECTURER',
    'Thảo luận về bài toán Concurrency khi sinh viên nộp bài thi đồng thời',
    'Các em lưu ý áp dụng cơ chế Khóa lạc quan (Optimistic Concurrency Control qua versioning) để giải quyết tình huống hàng ngàn sinh viên bấm nộp bài cùng 1 giây nhé!',
    now
  );

  console.log('[Seed] Khởi tạo dữ liệu mẫu thành công!');
}
