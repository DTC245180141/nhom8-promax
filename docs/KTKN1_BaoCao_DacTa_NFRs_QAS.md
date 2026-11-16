npx cap add android# BÁO CÁO ĐẶC TẢ YÊU CẦU KIẾN TRÚC PHẦN MỀM

**Đề tài:** Hệ thống Quản lý Học tập (LMS) cho Trường Đại học  
**Học phần:** Kiến trúc phần mềm  
**Nhiệm vụ:** Bài kiểm tra kỹ năng 1 (KTKN 1) — Đặc tả NFRs, QAS và Ràng buộc hệ thống  

---

## 1. Giới thiệu tổng quan hệ thống

* **Tên hệ thống:** Hệ thống Quản lý Học tập (University Learning Management System — U-LMS).
* **Bối cảnh xây dựng:** Trường đại học cần chuyển đổi số toàn diện hoạt động dạy và học trực tuyến. Hệ thống được triển khai thí điểm ban đầu cho quy mô một khoa (~2.000 sinh viên) và có lộ trình mở rộng lên quy mô toàn trường (~30.000 sinh viên) trong các học kỳ tiếp theo.
* **Mục tiêu nghiệp vụ:**
  * Tin học hóa và chuẩn hóa quy trình dạy – học – đánh giá trực tuyến giữa giảng viên và sinh viên.
  * Đảm bảo hệ thống vận hành ổn định, dễ bảo trì và có khả năng tiến hóa cấu trúc linh hoạt theo lộ trình tăng trưởng quy mô người dùng mà không phải xây dựng lại từ đầu.
* **Phạm vi chức năng chính:** Quản lý tài khoản và phân quyền (giảng viên, sinh viên, quản trị viên); Quản lý lớp học phần; Quản lý bài giảng/tài liệu; Quản lý bài tập; Quản lý kiểm tra/thi trực tuyến; Diễn đàn thảo luận; Quản lý điểm số; Quản lý thông báo.

---

## 2. Các nhóm người dùng và bên liên quan (Stakeholders)

| STT | Nhóm Stakeholder | Vai trò | Mối quan tâm chính đối với hệ thống (Concerns) |
| :---: | :--- | :--- | :--- |
| 1 | **Sinh viên** | Người dùng cuối (End-user) | Truy cập bài giảng nhanh, không giật lag; giao diện dễ thao tác; nộp bài tập và làm bài thi ổn định, không bị mất dữ liệu khi mạng chập chờn; nhận thông báo và xem điểm kịp thời. |
| 2 | **Giảng viên** | Người dùng cuối (End-user) | Đăng tải tài liệu, giao bài tập, tạo đề kiểm tra thuận tiện; chấm điểm nhanh chóng; quản lý thảo luận lớp học hiệu quả; bảo đảm tính chính xác và an toàn của điểm số. |
| 3 | **Quản trị viên hệ thống (Admin / IT Ops)** | Vận hành & Bảo trì | Hệ thống dễ giám sát, sao lưu; chịu tải tốt trong các khung giờ cao điểm (kỳ thi, hạn nộp bài); dễ dàng mở rộng quy mô từ 1 khoa lên toàn trường mà không làm gián đoạn dịch vụ. |
| 4 | **Ban Giám hiệu / Phòng Đào tạo** | Chủ đầu tư / Quản lý nghiệp vụ | Chi phí đầu tư ban đầu hợp lý; dữ liệu người học, lớp học và kết quả học tập nhất quán, tích hợp được với Cổng thông tin đào tạo của trường. |
| 5 | **Nhóm phát triển phần mềm (Dev Team)** | Xây dựng & Nâng cấp | Cấu trúc phân hệ rõ ràng, ranh giới độc lập để phát triển song song; dễ kiểm thử hồi quy và dễ dàng tách dịch vụ về sau khi quy mô tăng. |

---

## 3. Yêu cầu chức năng cốt lõi (Functional Requirements)

| Mã YC | Phân hệ | Mô tả yêu cầu chức năng cốt lõi |
| :---: | :--- | :--- |
| **FR-01** | Quản lý Tài khoản & Lớp học | Đăng nhập, phân quyền người dùng (Sinh viên, Giảng viên, Quản trị viên); quản lý và đồng bộ danh sách người học, giảng viên và lớp học phần theo từng học kỳ. |
| **FR-02** | Quản lý Bài giảng | Giảng viên tải lên, phân loại và cập nhật tài liệu học tập (văn bản, slide, liên kết); sinh viên tra cứu, xem và tải tài liệu theo từng lớp học phần đã đăng ký. |
| **FR-03** | Quản lý Bài tập | Giảng viên tạo bài tập và thiết lập thời hạn nộp; sinh viên nộp bài trực tuyến; hệ thống ghi nhận thời gian nộp và hỗ trợ cơ chế lưu vết để tránh thất lạc bài nộp. |
| **FR-04** | Quản lý Kiểm tra | Giảng viên thiết lập ngân hàng câu hỏi và tạo đề kiểm tra giới hạn thời gian; sinh viên làm bài trực tuyến, hệ thống tự động lưu bài định kỳ và tự động thu bài khi hết giờ. |
| **FR-05** | Quản lý Điểm | Tự động chấm điểm đối với câu hỏi trắc nghiệm; cung cấp giao diện cho giảng viên chấm điểm tự luận; tổng hợp bảng điểm lớp học phần và cho phép sinh viên tra cứu điểm cá nhân. |
| **FR-06** | Diễn đàn thảo luận | Tạo chủ đề thảo luận theo từng lớp học phần hoặc bài học cụ thể; cho phép giảng viên và sinh viên trao đổi, đăng bình luận và giải đáp thắc mắc học tập. |
| **FR-07** | Quản lý Thông báo | Phát thông báo tự động (khi có tài liệu mới, sắp đến hạn nộp bài, công bố điểm) và phát thông báo điều hành từ giảng viên/nhà trường đến từng nhóm sinh viên. |

---

## 4. Đặc tả Yêu cầu phi chức năng (NFRs) & Phân loại ưu tiên

### 4.1. Bảng đặc tả định lượng NFRs

| Mã NFR | Thuộc tính chất lượng | Mô tả yêu cầu | Tiêu chí định lượng / Điều kiện kiểm chứng |
| :---: | :--- | :--- | :--- |
| **NFR-01** | **Khả năng tiến hóa & Mở rộng (Evolvability & Scalability)** | Hệ thống đáp ứng tốt quy mô ban đầu một khoa và có khả năng mở rộng lên toàn trường mà không phải tái thiết kế toàn bộ hệ thống. | - Giai đoạn 1: Phục vụ **2.000 sinh viên** (tối đa **500 người dùng đồng thời - CCU**).<br>- Giai đoạn 2: Phục vụ **30.000 sinh viên** (tối đa **5.000 người dùng đồng thời - CCU**).<br>- Thời gian tách một phân hệ (VD: Kiểm tra) thành dịch vụ độc lập **dưới 2 tuần**, không làm gián đoạn hoạt động của các phân hệ còn lại. |
| **NFR-02** | **Tính sẵn sàng & Độ tin cậy (Availability & Reliability)** | Hệ thống hoạt động liên tục trong suốt học kỳ; đảm bảo an toàn dữ liệu bài nộp và bài làm của sinh viên khi xảy ra lỗi tạm thời. | - Mức độ sẵn sàng (Uptime) đạt tối thiểu **99,5%** trong học kỳ (tổng thời gian gián đoạn ngoài kế hoạch không quá **3,6 giờ/tháng**).<br>- Tỉ lệ mất mát dữ liệu bài nộp/bài thi bằng **0%**.<br>- Thời gian phục hồi hoạt động (RTO) **dưới 15 phút** khi gặp sự cố phần mềm/dịch vụ tạm thời. |
| **NFR-03** | **Hiệu năng (Performance)** | Đảm bảo tốc độ phản hồi nhanh khi sinh viên truy cập tài liệu và gửi dữ liệu bài làm trong các khung giờ cao điểm. | - Thời gian phản hồi trung bình khi tải trang hoặc xem bài giảng **dưới 2 giây** (áp dụng với 95% số yêu cầu ở mức tải 5.000 CCU).<br>- Thời gian xử lý và phản hồi xác nhận nộp bài tập/bài thi **dưới 3 giây**. |
| **NFR-04** | **Khả năng bảo trì (Maintainability)** | Các phân hệ có ranh giới rõ ràng; việc sửa đổi nghiệp vụ của một phân hệ không gây lỗi lan truyền sang các phân hệ khác. | - Sửa đổi logic nghiệp vụ trong 1 phân hệ tác động **0%** đến mã nguồn của các phân hệ khác.<br>- Mức độ bao phủ kiểm thử tự động (Test Coverage) cho các luồng nghiệp vụ cốt lõi đạt tối thiểu **80%**. |
| **NFR-05** | **Bảo mật (Security)** | Đảm bảo an toàn dữ liệu đề thi, điểm số và thông tin cá nhân của người học và giảng viên. | - **100%** dữ liệu truyền tải trên đường truyền mạng được mã hóa qua các giao thức bảo mật chuẩn.<br>- Kiểm soát truy cập chặt chẽ: sinh viên chỉ xem được điểm của chính mình và tài liệu thuộc lớp học phần đã đăng ký (tỉ lệ kiểm thử phân quyền thành công đạt **100%**). |
| **NFR-06** | **Khả năng sử dụng (Usability)** | Giao diện trực quan, thân thiện, dễ tiếp cận trên cả trình duyệt máy tính và thiết bị di động. | - Sinh viên mới thao tác thành công việc tìm kiếm tài liệu và nộp bài tập đầu tiên trong thời gian **dưới 5 phút** mà không cần qua đào tạo hướng dẫn. |

### 4.2. Phân loại mức độ ưu tiên và Giải thích

| Mức độ ưu tiên | Mã NFR | Lý do ưu tiên dựa trên mục tiêu hệ thống |
| :---: | :--- | :--- |
| **Cao (High)** | **NFR-01** (Tiến hóa & Mở rộng)<br>**NFR-02** (Sẵn sàng & Tin cậy)<br>**NFR-04** (Bảo trì) | Đây là các động lực kiến trúc (Architectural Drivers) quyết định trực tiếp sự thành bại của đề tài theo yêu cầu *"Tiến hóa kiến trúc theo quy mô từ 1 khoa lên toàn trường"*. Nếu không đảm bảo ranh giới phân hệ và tính sẵn sàng, hệ thống sẽ gặp tắc nghẽn nghiêm trọng khi số lượng sinh viên tăng từ 2.000 lên 30.000, đồng thời việc mất bài thi của sinh viên sẽ dẫn đến hậu quả nghiêm trọng về mặt học vụ. |
| **Trung bình (Medium)** | **NFR-03** (Hiệu năng)<br>**NFR-05** (Bảo mật) | Rất quan trọng để duy trì trải nghiệm người dùng và tính bảo mật của dữ liệu học vụ. Các chỉ số này có thể được tinh chỉnh và nâng cấp theo từng giai đoạn mở rộng quy mô hạ tầng. |
| **Thấp (Low)** | **NFR-06** (Khả năng sử dụng) | Cần thiết cho trải nghiệm người dùng, tuy nhiên các luồng thao tác của hệ thống quản lý học tập (LMS) đã theo các chuẩn quen thuộc của môi trường đại học, có thể hoàn thiện dần qua các vòng lặp phản hồi người dùng. |

---

## 5. Kịch bản chất lượng (Quality Attribute Scenarios — QAS)

### QAS-01: Kịch bản về Hiệu năng (Performance Scenario)

* **Nguồn kích thích (Source):** 5.000 sinh viên toàn trường (người dùng đồng thời).
* **Kích thích (Stimulus):** Đồng loạt gửi yêu cầu truy xuất tài liệu bài giảng và nộp bài tập lớn trong 5 phút cuối cùng trước thời hạn chót (deadline).
* **Môi trường (Environment):** Hệ thống đang vận hành ở Giai đoạn 2 (quy mô toàn trường 30.000 sinh viên) trong tuần lễ cao điểm của học kỳ.
* **Thành phần bị tác động (Artifact):** Phân hệ Quản lý Bài giảng, Phân hệ Quản lý Bài tập và Thành phần lưu trữ dữ liệu.
* **Phản hồi (Response):** Hệ thống tiếp nhận toàn bộ các yêu cầu nộp bài vào cơ chế xếp hàng xử lý tuần tự, duy trì phân bổ tải ổn định và trả về mã xác nhận tiếp nhận bài làm thành công cho sinh viên.
* **Thước đo phản hồi (Response Measure):** 95% yêu cầu xem tài liệu phản hồi trong **dưới 2 giây**; 100% yêu cầu nộp bài nhận được phản hồi tiếp nhận trong **dưới 3 giây**; tỉ lệ phát sinh lỗi hệ thống (HTTP 5xx) **dưới 0,1%**.

### QAS-02: Kịch bản về Tính sẵn sàng (Availability Scenario)

* **Nguồn kích thích (Source):** Lỗi tiến trình phần mềm nội bộ hoặc nghẽn kết nối mạng tạm thời.
* **Kích thích (Stimulus):** Dịch vụ tiếp nhận bài thi của phân hệ Kiểm tra bị dừng hoạt động đột ngột trong khi 1.000 sinh viên đang thao tác làm bài thi trực tuyến giữa kỳ.
* **Môi trường (Environment):** Trong khung thời gian làm bài thi chính thức có giám sát của học kỳ.
* **Thành phần bị tác động (Artifact):** Phân hệ Quản lý Kiểm tra.
* **Phản hồi (Response):** Hệ thống phát hiện sự cố gián đoạn tự động, kích hoạt cơ chế lưu trữ tạm bài làm ở phía máy trạm/bộ đệm trung gian, phục hồi tiến trình dịch vụ và tự động đồng bộ lại toàn bộ dữ liệu bài làm khi dịch vụ hoạt động trở lại.
* **Thước đo phản hồi (Response Measure):** Thời gian phát hiện và khôi phục dịch vụ **dưới 2 phút**; **0%** dữ liệu câu trả lời của sinh viên bị thất lạc; mức độ sẵn sàng chung của học kỳ vẫn được duy trì **$\ge$ 99,5%**.

### QAS-03: Kịch bản về Khả năng tiến hóa (Evolvability Scenario)

* **Nguồn kích thích (Source):** Ban Giám hiệu và Phòng Đào tạo nhà trường.
* **Kích thích (Stimulus):** Quyết định mở rộng hệ thống từ phạm vi một khoa (2.000 sinh viên) ra toàn trường (30.000 sinh viên) và yêu cầu tách riêng phân hệ Kiểm tra để triển khai độc lập nhằm tối ưu tài nguyên cho các kỳ thi tập trung.
* **Môi trường (Environment):** Trong giai đoạn chuyển tiếp học kỳ (hệ thống vẫn đang duy trì phục vụ việc tra cứu điểm và tiếp nhận thông báo).
* **Thành phần bị tác động (Artifact):** Cấu trúc kiến trúc toàn hệ thống và Phân hệ Quản lý Kiểm tra.
* **Phản hồi (Response):** Đội ngũ phát triển tách biệt phân hệ Kiểm tra thành một dịch vụ độc lập dựa trên các hợp đồng giao tiếp (Interfaces/APIs) đã thiết lập từ trước, không cần sửa đổi mã nguồn xử lý của các phân hệ Bài giảng, Điểm hay Diễn đàn.
* **Thước đo phản hồi (Response Measure):** Thời gian hoàn thành việc phân tách và đưa vào vận hành **dưới 2 tuần**; số dòng mã nguồn bị chỉnh sửa ở các phân hệ khác bằng **0**; thời gian dừng dịch vụ toàn hệ thống (downtime) trong quá trình nâng cấp **dưới 30 phút**.

---

## 6. Các ràng buộc hệ thống (System Constraints)

| Nhóm ràng buộc | Nội dung ràng buộc cụ thể |
| :--- | :--- |
| **Ràng buộc tiến hóa & vận hành** | Quá trình triển khai bắt buộc phải chia làm hai giai đoạn rõ rệt (Khoa $\rightarrow$ Toàn trường); kiến trúc ban đầu phải tinh gọn, dễ vận hành, nhưng phải thiết lập ranh giới phân hệ tuyệt đối rõ ràng để tránh phát sinh chi phí đập đi xây lại khi mở rộng. |
| **Ràng buộc dữ liệu** | Nghiệp vụ giữa các phân hệ (Bài giảng, Bài tập, Kiểm tra, Điểm, Diễn đàn) có tính liên kết chặt chẽ; hệ thống bắt buộc phải duy trì tính toàn vẹn và nhất quán của các thực thể dữ liệu cốt lõi: Người học, Lớp học phần và Học kỳ. |
| **Ràng buộc tích hợp** | Hệ thống phải thiết lập các giao diện chuẩn để sẵn sàng tích hợp với hạ tầng công nghệ thông tin sẵn có của trường: Cổng quản lý tài khoản định danh sinh viên, Hệ thống quản lý đào tạo và Cổng quản lý điểm tập trung. |
| **Ràng buộc ngân sách & thời gian** | Ở giai đoạn thử nghiệm cho một khoa, ngân sách dành cho hạ tầng kỹ thuật bị giới hạn; hệ thống cần được xây dựng và đưa vào vận hành thử nghiệm gói gọn trong khung thời gian một học kỳ. |
| **Ràng buộc bảo mật & pháp lý** | Phải tuân thủ các quy định về bảo vệ dữ liệu cá nhân của người học và giảng viên; đáp ứng quy chế quản lý đào tạo đại học, quy định về bảo mật đề thi và lưu trữ kết quả học tập của Bộ Giáo dục & Đào tạo và Nhà trường. |

---

## 7. Tài liệu tham khảo

1. Bass, L., Clements, P., & Kazman, R. (2021). *Software Architecture in Practice* (4th ed.). Addison-Wesley Professional.
2. Richards, M., & Ford, N. (2020). *Fundamentals of Software Architecture: An Engineering Approach*. O'Reilly Media.
3. ISO/IEC/IEEE 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*.
