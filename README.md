# HƯỚNG DẪN VẬN HÀNH & TỔNG KẾT ĐỒ ÁN U-LMS

**Đề tài:** Hệ thống Quản lý Học tập (LMS) cho Trường Đại học  
**Môn học:** Kiến trúc phần mềm  

---

## 1. Cấu trúc cây thư mục toàn diện của đồ án

```
c:\doan4nguoi\
├── docs\
│   ├── KTKN1_BaoCao_DacTa_NFRs_QAS.md        # Bài KTKN 1: Báo cáo đặc tả NFRs, QAS, Ràng buộc
│   └── KTKN2_ThietKe_KienTruc_4cong1.md       # Bài KTKN 2: Thiết kế 4+1 Views, ADR, Concurrency Flow
├── backend\
│   ├── src\
│   │   ├── shared\                            # Hạt nhân dùng chung (Event Bus, SQLite Database, Auth Middleware)
│   │   │   ├── events\event-bus.ts            # In-memory Domain Event Bus (Tương thích Kafka/RabbitMQ)
│   │   │   ├── database\database.service.ts   # Database SQLite với 7 schemas phân hệ
│   │   │   ├── database\seed.ts               # Khởi tạo dữ liệu mẫu tự động
│   │   │   └── middleware\auth.middleware.ts  # Xác thực JWT & phân quyền RBAC
│   │   ├── modules\                           # 7 Bounded Contexts độc lập (Clean Architecture)
│   │   │   ├── identity\                      # Quản lý tài khoản, đăng nhập, token
│   │   │   ├── course\                        # Lớp học phần, bài giảng, tài liệu
│   │   │   ├── assignment\                    # Giao bài tập, nộp bài, Versioning Concurrency
│   │   │   ├── quiz\                          # Đề thi trắc nghiệm, thi online, tự chấm điểm
│   │   │   ├── grading\                       # Bảng điểm cá nhân, tổng hợp điểm lớp
│   │   │   ├── forum\                         # Diễn đàn trao đổi thảo luận
│   │   │   └── notification\                  # Thông báo tự động theo sự kiện
│   │   └── main.ts                            # Khởi động máy chủ Express
│   ├── tests\
│   │   └── ulms.test.ts                       # Bộ kiểm thử tự động Jest (100% Passed)
│   ├── package.json
│   └── tsconfig.json
├── frontend\
│   └── index.html                             # Giao diện web trực quan đầy đủ tính năng & mô phỏng Concurrency
└── README.md
```

---

## 2. Hướng dẫn chạy và nghiệm thu

### 2.1. Khởi chạy Backend
Backend đã được build và đang chạy nền tại cổng `5000`:
* Endpoint kiểm tra tình trạng: `http://localhost:5000/health`
* Khởi động lại (nếu cần):
  ```powershell
  cd c:\doan4nguoi\backend
  npm run build
  npm start
  ```

### 2.2. Chạy kiểm thử tự động (Automated Tests)
Kiểm thử tự động cho toàn bộ luồng nghiệp vụ và tính sẵn sàng của kiến trúc:
```powershell
cd c:\doan4nguoi\backend
npm test
```
*Kết quả:* **6/6 test cases Passed** (Health check, Login Giảng viên, Login Sinh viên, Khóa học, Thi Quiz tự chấm, Đồng bộ Event Bus sang Bảng điểm).

### 2.3. Trải nghiệm Giao diện Web (Frontend)
Mở trực tiếp file `frontend/index.html` trên trình duyệt:
* Đường dẫn: [index.html](file:///c:/doan4nguoi/frontend/index.html)
* **Tài khoản Giảng viên:** `giangvien@ulms.edu.vn` (Mật khẩu: `123456`)
* **Tài khoản Sinh viên:** `sinhvien1@ulms.edu.vn` (Mật khẩu: `123456`)
* **Tính năng nổi bật:** Chuyển đổi nhanh vai trò Giảng viên/Sinh viên, làm bài thi Quiz trắc nghiệm chấm điểm tự động, và tab **"Giám sát Kiến trúc & Concurrency"** cho phép bấm test 50 requests đồng thời.
