
## 10. Giải Thích Mã Nguồn và Cấu Trúc Dự Án

Phần này cung cấp cái nhìn tổng quan về cách tổ chức mã nguồn và các thành phần chính trong dự án GradeView.

### 10.1. Cấu Trúc Thư Mục Gốc

Khi bạn clone dự án, thư mục gốc (`grade_view`) sẽ chứa các tệp và thư mục con sau:

```
grade_view/
├── backend/              # Mã nguồn và Dockerfile cho Backend (Express.js/TypeScript)
├── frontend/             # Mã nguồn và Dockerfile cho Frontend (Next.js/TypeScript)
├── keycloak-26.2.4/      # (Có thể là) Bản phân phối Keycloak tải về (ít quan trọng nếu dùng Docker image)
├── .env                  # (Cần tạo thủ công) Chứa các biến môi trường
├── docker-compose.yml    # Định nghĩa các service Docker cho môi trường đầy đủ
├── docker-compose.dev.yml # Định nghĩa các service Docker cho môi trường phát triển (chỉ dependencies)
├── gradeview-realm.json  # Tệp cấu hình realm Keycloak để tự động import
├── init-multiple-db.sh   # Script khởi tạo database phụ cho Keycloak trong PostgreSQL
├── README.md             # README gốc của dự án
└── .gitignore            # Các tệp và thư mục được Git bỏ qua
```

**Giải thích các thành phần chính:**

*   **`backend/`**: Chứa toàn bộ mã nguồn của ứng dụng backend, bao gồm logic nghiệp vụ, API endpoints, kết nối cơ sở dữ liệu, và tích hợp Keycloak.
*   **`frontend/`**: Chứa toàn bộ mã nguồn của ứng dụng frontend, bao gồm giao diện người dùng, quản lý trạng thái, gọi API, và tích hợp Keycloak.
*   **`keycloak-26.2.4/`**: Thư mục này chứa bản phân phối của Keycloak phiên bản 26.2.4. Tuy nhiên, tệp `docker-compose.yml` sử dụng image `quay.io/keycloak/keycloak:26.2.4` trực tiếp từ registry. Thư mục này có thể dùng cho mục đích tham khảo hoặc các kịch bản cài đặt không dùng Docker image, nhưng không trực tiếp tham gia vào quá trình chạy bằng `docker-compose.yml` (ngoại trừ việc nó có thể là nguồn gốc của `gradeview-realm.json` ban đầu).
*   **`.env`**: Tệp cấu hình quan trọng nhất, chứa các thông tin nhạy cảm và cấu hình môi trường. **Bạn phải tạo tệp này thủ công.**
*   **`docker-compose.yml`**: Định nghĩa cách Docker sẽ xây dựng và chạy các container `frontend`, `backend`, `postgres`, và `keycloak` cùng với mạng và volume cần thiết cho môi trường hoạt động đầy đủ.
*   **`docker-compose.dev.yml`**: Một phiên bản rút gọn của `docker-compose.yml`, chỉ dùng để khởi động `postgres` và `keycloak` nhằm hỗ trợ phát triển local cho `frontend` và `backend`.
*   **`gradeview-realm.json`**: Tệp JSON chứa định nghĩa đầy đủ của realm `gradeview` trong Keycloak, bao gồm clients, roles, và các cài đặt khác. Được tự động import khi Keycloak khởi động lần đầu thông qua `docker-compose.yml`.
*   **`init-multiple-db.sh`**: Một shell script được thực thi bởi container `postgres` khi khởi động lần đầu, dùng để tạo thêm database `keycloak` bên cạnh database `gradeview` chính.

### 10.2. Cấu Trúc Thư Mục `frontend/` (Next.js)

Bên trong thư mục `frontend/`, cấu trúc thường theo chuẩn của Next.js (App Router):

```
frontend/
├── public/             # Chứa các tài nguyên tĩnh (hình ảnh, fonts)
├── src/
│   ├── app/            # Cấu trúc routing chính (App Router)
│   │   ├── (auth)/     # Nhóm route cho các trang xác thực (login, register)
│   │   ├── (dashboard)/ # Nhóm route cho các trang sau khi đăng nhập
│   │   │   ├── layout.tsx # Bố cục chung cho dashboard
│   │   │   └── page.tsx   # Trang dashboard chính
│   │   ├── layout.tsx    # Bố cục gốc của ứng dụng
│   │   └── page.tsx      # Trang chủ (có thể chuyển hướng)
│   ├── components/       # Các React component tái sử dụng (UI elements)
│   ├── hooks/            # Các React hook tùy chỉnh (ví dụ: useAuth)
│   ├── lib/              # Các hàm tiện ích, cấu hình thư viện
│   ├── services/         # Logic gọi API backend
│   └── styles/           # Các tệp CSS toàn cục hoặc module
├── .env.local          # (Tùy chọn) Biến môi trường cho local development
├── Dockerfile          # Định nghĩa cách build Docker image cho Frontend
├── next.config.js      # Tệp cấu hình Next.js
├── package.json        # Danh sách dependencies và scripts (dev, build, start)
└── tsconfig.json       # Cấu hình TypeScript
```

**Các thành phần quan trọng:**

*   **`src/app/`**: Nơi định nghĩa các trang và route của ứng dụng theo kiến trúc App Router của Next.js.
*   **`src/components/`**: Chứa các thành phần giao diện người dùng (UI) có thể tái sử dụng trên nhiều trang.
*   **`src/hooks/`**: Chứa các custom hook, ví dụ `useAuth` để quản lý trạng thái đăng nhập và tương tác với Keycloak.
*   **`src/services/` hoặc `src/lib/api/`**: Nơi chứa logic để gọi các API từ Backend.
*   **`Dockerfile`**: Chỉ dẫn để Docker xây dựng image cho ứng dụng Next.js, thường bao gồm các bước cài đặt dependencies, build ứng dụng, và cấu hình server để chạy ứng dụng đã build.
*   **`package.json`**: Quản lý các thư viện JavaScript/TypeScript cần thiết và định nghĩa các lệnh như `npm run dev`, `npm run build`.

### 10.3. Cấu Trúc Thư Mục `backend/` (Express.js/TypeScript)

Bên trong thư mục `backend/`, cấu trúc thường theo mô hình MVC (Model-View-Controller) hoặc tương tự, tách biệt các mối quan tâm:

```
backend/
├── src/
│   ├── config/         # Cấu hình ứng dụng (database, keycloak, session)
│   ├── controllers/    # Xử lý request, gọi service, trả về response
│   ├── middleware/     # Các hàm xử lý trung gian (xác thực, logging, error handling)
│   ├── models/         # Định nghĩa cấu trúc dữ liệu, tương tác database (ví dụ: Sequelize, TypeORM models)
│   ├── routes/         # Định nghĩa các API endpoints và liên kết với controllers
│   ├── services/       # Chứa logic nghiệp vụ chính
│   ├── types/          # Định nghĩa các kiểu dữ liệu TypeScript tùy chỉnh
│   └── server.ts / index.ts # Điểm khởi đầu của ứng dụng, thiết lập server Express
├── .env                # (Cần tạo thủ công cho local dev) Biến môi trường local
├── Dockerfile          # Định nghĩa cách build Docker image cho Backend
├── package.json        # Danh sách dependencies và scripts (dev, build, start)
└── tsconfig.json       # Cấu hình TypeScript
```

**Các thành phần quan trọng:**

*   **`src/config/`**: Chứa các tệp hoặc logic để tải và quản lý cấu hình ứng dụng từ biến môi trường hoặc tệp cấu hình.
*   **`src/controllers/`**: Nhận yêu cầu HTTP từ routes, gọi các hàm trong `services` để thực hiện logic, và định dạng dữ liệu trả về cho client.
*   **`src/middleware/`**: Các hàm được thực thi trước hoặc sau route handlers, dùng cho các tác vụ như xác thực token Keycloak, kiểm tra quyền, ghi log, xử lý lỗi chung.
*   **`src/models/`**: Định nghĩa schema dữ liệu và cung cấp phương thức để tương tác với cơ sở dữ liệu PostgreSQL (thường sử dụng một ORM như Sequelize hoặc TypeORM).
*   **`src/routes/`**: Định nghĩa các đường dẫn API (endpoints), các phương thức HTTP được chấp nhận (GET, POST, PUT, DELETE), và liên kết chúng với các hàm xử lý trong `controllers` và các `middleware` cần thiết.
*   **`src/services/`**: Nơi chứa phần lớn logic nghiệp vụ của ứng dụng, tách biệt khỏi tầng controller và model.
*   **`server.ts` / `index.ts`**: Tệp chính khởi tạo ứng dụng Express, áp dụng các middleware, gắn kết các routes, và khởi động server lắng nghe các kết nối đến.
*   **`Dockerfile`**: Chỉ dẫn để Docker xây dựng image cho ứng dụng Express.js, bao gồm cài đặt dependencies, biên dịch TypeScript sang JavaScript (nếu cần), và chỉ định lệnh để chạy server.
*   **`package.json`**: Quản lý dependencies và định nghĩa các scripts như `npm run dev` (chạy với `ts-node-dev` hoặc `nodemon`), `npm run build` (biên dịch TypeScript), `npm run start` (chạy code đã biên dịch).



## 11. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

Trong quá trình cài đặt và sử dụng hệ thống, bạn có thể gặp một số vấn đề. Dưới đây là các sự cố thường gặp và cách khắc phục:

*   **Lỗi xung đột cổng (Port Conflict):**
    *   **Triệu chứng:** Docker Compose báo lỗi khi khởi động một service (ví dụ: `Error starting userland proxy: listen tcp4 0.0.0.0:8080: bind: address already in use`).
    *   **Nguyên nhân:** Một ứng dụng khác trên máy của bạn đang sử dụng cổng mà container đang cố gắng chiếm dụng (ví dụ: 8080 cho Keycloak, 3000 cho Frontend, 5000 cho Backend, 5432 cho PostgreSQL).
    *   **Giải pháp:**
        1.  Xác định ứng dụng đang sử dụng cổng đó (sử dụng các lệnh như `netstat -ano | findstr <PORT>` trên Windows hoặc `sudo lsof -i :<PORT>` trên macOS/Linux).
        2.  Dừng ứng dụng đó nếu có thể.
        3.  Hoặc, thay đổi cổng được map ra bên ngoài trong tệp `docker-compose.yml` hoặc `.env`. Ví dụ, thay đổi `"8080:8080"` thành `"8081:8080"` để truy cập Keycloak qua cổng 8081 trên máy host.

*   **Keycloak không khởi động hoặc lỗi khi khởi động:**
    *   **Triệu chứng:** Container Keycloak dừng lại ngay sau khi khởi động, hoặc logs (`docker compose logs keycloak`) báo lỗi liên quan đến database hoặc cấu hình.
    *   **Nguyên nhân:**
        *   Lỗi kết nối đến PostgreSQL (sai host, port, user, password trong `.env`).
        *   Database `keycloak` chưa được tạo (nếu script `init-multiple-db.sh` không chạy đúng hoặc không được dùng).
        *   Lỗi cấu hình trong `.env` (ví dụ: `KC_DB_URL`).
        *   Phiên bản Keycloak không tương thích với cấu hình hoặc database.
    *   **Giải pháp:**
        1.  Kiểm tra kỹ các biến môi trường liên quan đến Keycloak và Database trong tệp `.env`.
        2.  Kiểm tra logs của container `keycloak` và `postgres`:
            ```bash
            docker compose logs keycloak
            docker compose logs postgres
            ```
        3.  Đảm bảo container `postgres` đã khởi động thành công trước `keycloak` (`depends_on` trong `docker-compose.yml` đã xử lý việc này).
        4.  Thử xóa volume của PostgreSQL (`docker compose down --volumes` và `docker compose up -d`) để khởi tạo lại từ đầu (sẽ mất dữ liệu cũ).

*   **Không thể đăng nhập vào ứng dụng (qua Keycloak):**
    *   **Triệu chứng:** Sau khi nhập đúng username/password trên trang Keycloak, bị chuyển hướng lại Frontend với lỗi, hoặc quay lại trang đăng nhập.
    *   **Nguyên nhân:**
        *   Cấu hình `Valid Redirect URIs` hoặc `Web Origins` trong client `gradeview-frontend` trên Keycloak không chính xác (không khớp với URL Frontend `http://localhost:3000`).
        *   Client `gradeview-frontend` chưa được kích hoạt (Enabled).
        *   Realm `gradeview` không tồn tại hoặc chưa được chọn đúng.
        *   Lỗi cấu hình phía Frontend (sai `NEXT_PUBLIC_KEYCLOAK_URL`, `REALM`, `CLIENT_ID`).
    *   **Giải pháp:**
        1.  Truy cập Keycloak Admin Console (`http://localhost:8080`).
        2.  Chọn realm `gradeview`.
        3.  Vào "Clients" -> `gradeview-frontend`.
        4.  Kiểm tra tab "Settings", đảm bảo "Valid Redirect URIs" chứa `http://localhost:3000/*` và "Web Origins" chứa `http://localhost:3000`.
        5.  Kiểm tra các biến môi trường `NEXT_PUBLIC_...` trong `frontend/.env.local` (nếu chạy local) hoặc trong `docker-compose.yml`.
        6.  Xóa cache và cookies của trình duyệt.

*   **API Backend trả về lỗi 401 Unauthorized hoặc 403 Forbidden:**
    *   **Triệu chứng:** Frontend không thể lấy dữ liệu từ Backend, console trình duyệt báo lỗi 401 hoặc 403.
    *   **Nguyên nhân:**
        *   Access Token không được gửi kèm yêu cầu, hoặc gửi sai định dạng.
        *   Access Token đã hết hạn.
        *   Backend không thể xác thực token với Keycloak (sai `KEYCLOAK_URL`, `REALM`, `CLIENT_ID`, hoặc **`KEYCLOAK_CLIENT_SECRET`** trong `backend/.env`).
        *   Người dùng không có đủ quyền (role) để truy cập endpoint đó (lỗi 403).
    *   **Giải pháp:**
        1.  **Quan trọng:** Kiểm tra lại xem bạn đã lấy đúng `KEYCLOAK_CLIENT_SECRET` từ Keycloak Admin Console và cập nhật vào tệp `.env` (cả gốc và `backend/.env` nếu chạy local) chưa? **Khởi động lại container `backend`** sau khi cập nhật (`docker compose restart backend`).
        2.  Kiểm tra logs của container `backend` (`docker compose logs backend`) để xem chi tiết lỗi xác thực token.
        3.  Kiểm tra cấu hình Keycloak trong `backend/.env` (đặc biệt là `KEYCLOAK_URL` phải là `http://keycloak:8080` khi chạy trong Docker, và `http://localhost:8080` khi chạy local).
        4.  Nếu lỗi 403, kiểm tra xem người dùng đang đăng nhập có được gán đúng role cần thiết trong Keycloak Admin Console hay không, và logic phân quyền trong mã nguồn Backend (`src/middleware/` hoặc `src/routes/`) có đúng không.
        5.  Thử đăng xuất và đăng nhập lại trên Frontend để lấy token mới.

*   **Không kết nối được Database từ Backend:**
    *   **Triệu chứng:** Backend báo lỗi không thể kết nối đến PostgreSQL.
    *   **Nguyên nhân:** Sai thông tin kết nối database (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) trong `backend/.env`.
    *   **Giải pháp:**
        1.  Kiểm tra kỹ các biến `DB_...` trong `backend/.env`.
        2.  Khi chạy Backend trong Docker (qua `docker-compose.yml`), `DB_HOST` phải là tên service `postgres`.
        3.  Khi chạy Backend local và kết nối đến PostgreSQL trong Docker (qua `docker-compose.dev.yml`), `DB_HOST` phải là `localhost`.
        4.  Đảm bảo container `postgres` đang chạy.



## 12. Đóng Góp và Phát Triển Mở Rộng

Dự án GradeView là một nền tảng có thể được mở rộng và cải thiện. Nếu bạn muốn đóng góp hoặc phát triển thêm các tính năng, dưới đây là một số gợi ý:

*   **Cải thiện Giao diện Người dùng (UI/UX):** Tối ưu hóa trải nghiệm người dùng trên Frontend, làm cho giao diện trực quan và thân thiện hơn.
*   **Thêm Tính Năng:**
    *   Quản lý lớp học chi tiết hơn.
    *   Tính năng thông báo cho giáo viên và học sinh.
    *   Thống kê và báo cáo điểm số nâng cao.
    *   Tích hợp với các hệ thống quản lý học tập (LMS) khác.
*   **Tối ưu Hiệu Năng:** Cải thiện tốc độ tải trang Frontend, tối ưu hóa truy vấn cơ sở dữ liệu Backend.
*   **Tăng cường Bảo mật:** Rà soát và vá các lỗ hổng bảo mật tiềm ẩn, cập nhật các thư viện phụ thuộc.
*   **Viết Unit Tests và Integration Tests:** Bổ sung các bài kiểm thử tự động để đảm bảo tính ổn định và đúng đắn của mã nguồn khi có thay đổi.

**Quy trình đóng góp (Gợi ý):**

1.  **Fork Repository:** Tạo một bản sao (fork) của kho chứa dự án về tài khoản Git của bạn.
2.  **Tạo Branch Mới:** Tạo một nhánh (branch) mới từ nhánh chính (ví dụ: `main` hoặc `develop`) cho tính năng hoặc bản sửa lỗi bạn muốn thực hiện (ví dụ: `git checkout -b feature/add-reporting`).
3.  **Phát triển:** Thực hiện các thay đổi mã nguồn trên nhánh mới của bạn.
4.  **Commit Changes:** Lưu lại các thay đổi với các commit message rõ ràng.
5.  **Push to Fork:** Đẩy (push) nhánh mới lên repository đã fork của bạn.
6.  **Tạo Pull Request:** Mở một Pull Request (PR) từ nhánh mới của bạn trên fork đến nhánh chính của repository gốc. Mô tả chi tiết các thay đổi và mục đích của PR.
7.  **Review và Merge:** Người quản lý dự án sẽ xem xét (review) mã nguồn trong PR, yêu cầu chỉnh sửa nếu cần, và cuối cùng hợp nhất (merge) vào nhánh chính nếu được chấp thuận.

## 13. Tài Liệu Tham Khảo

Dưới đây là các liên kết đến tài liệu chính thức của các công nghệ được sử dụng trong dự án:

*   **Keycloak:** [https://www.keycloak.org/documentation](https://www.keycloak.org/documentation)
*   **Next.js:** [https://nextjs.org/docs](https://nextjs.org/docs)
*   **Express.js:** [https://expressjs.com/](https://expressjs.com/)
*   **TypeScript:** [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
*   **PostgreSQL:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
*   **Docker:** [https://docs.docker.com/](https://docs.docker.com/)
*   **Docker Compose:** [https://docs.docker.com/compose/](https://docs.docker.com/compose/)

---

Hy vọng tài liệu README chi tiết này sẽ giúp bạn dễ dàng cài đặt, cấu hình, sử dụng và phát triển hệ thống GradeView.

