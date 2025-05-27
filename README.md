
# Hướng dẫn thiết lập hệ thống GradeView với Keycloak và PostgreSQL

## 1. Tổng quan hệ thống

GradeView là hệ thống quản lý điểm số với các vai trò sau:
- **Admin**: Quản lý người dùng, môn học
- **Giáo viên**: Quản lý và nhập điểm
- **Học sinh**: Xem điểm số

Hệ thống bao gồm:
- **Frontend**: Next.js
- **Backend**: Express.js với TypeScript
- **Database**: PostgreSQL
- **Xác thực**: Keycloak

## 2. Cài đặt hệ thống

### 2.1. Yêu cầu môi trường
- Docker và Docker Compose
- Node.js (để phát triển)

### 2.2. Khởi động hệ thống

```bash
# Clone dự án (nếu chưa có)
git clone <repository-url> grade_view
cd grade_view

# Chạy hệ thống với Docker
docker-compose up -d
```

Sau khi khởi động, các dịch vụ sẽ hoạt động tại:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Keycloak: http://localhost:8080
- PostgreSQL: localhost:5432

## 3. Thiết lập Keycloak

### 3.1. Đăng nhập Keycloak Admin Console

1. Truy cập: http://localhost:8080/admin/
2. Đăng nhập với tài khoản mặc định:
   - Username: `admin`
   - Password: `admin`

### 3.2. Tạo Realm

1. Nhấp vào dropdown menu "Master" ở góc trái trên
2. Chọn "Create Realm"
3. Nhập:
   - Name: `gradeview`
4. Nhấp "Create"

### 3.3. Tạo Client cho Frontend

1. Trong realm `gradeview`, chọn "Clients" từ menu bên trái
2. Nhấp "Create client"
3. Nhập thông tin:
   - Client ID: `gradeview-frontend`
   - Client type: `OpenID Connect`
   - Nhấp "Next"
4. Cấu hình client:
   - Client authentication: `OFF` (public client)
   - Authorization: `OFF`
   - Authentication flow:
     - Standard flow: `ON`
     - Implicit flow: `OFF`
     - Direct access grants: `ON`
     - Service accounts roles: `OFF`
   - Nhấp "Next"
5. Cấu hình URL:
   - Root URL: `http://localhost:3000`
   - Home URL: `http://localhost:3000`
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000` (cho CORS)
   - Nhấp "Save"

### 3.4. Tạo Client cho Backend

1. Chọn "Clients" từ menu bên trái
2. Nhấp "Create client"
3. Nhập thông tin:
   - Client ID: `gradeview-backend`
   - Client type: `OpenID Connect`
   - Nhấp "Next"
4. Cấu hình client:
   - Client authentication: `ON` (confidential client)
   - Authorization: `OFF`
   - Authentication flow:
     - Service accounts roles: `ON`
     - Nhấp "Next"
5. Nhấp "Save"
6. Lấy Client Secret:
   - Vào tab "Credentials"
   - Lưu lại giá trị "Client secret" - đây là khóa cần thiết để backend xác thực với Keycloak

### 3.5. Tạo Roles

1. Chọn "Realm roles" từ menu bên trái
2. Nhấp "Create role"
3. Tạo vai trò đầu tiên:
   - Role name: `admin`
   - Nhấp "Save"
4. Lặp lại để tạo:
   - Role name: `teacher`
   - Role name: `student`

### 3.6. Tạo Users

1. Chọn "Users" từ menu bên trái
2. Nhấp "Add user"
3. Tạo tài khoản Admin:
   - Username: `admin`
   - Email: `admin@example.com`
   - First name: `Admin`
   - Last name: `User`
   - Email verified: `ON`
   - Nhấp "Create"
4. Thiết lập mật khẩu:
   - Chọn tab "Credentials"
   - Nhấp "Set password"
   - Nhập mật khẩu và xác nhận
   - Temporary: `OFF` (để không yêu cầu đổi mật khẩu khi đăng nhập lần đầu)
   - Nhấp "Save"
5. Gán role:
   - Chọn tab "Role mapping"
   - Nhấp "Assign role"
   - Chọn role `admin`
   - Nhấp "Assign"
6. Lặp lại để tạo tài khoản Teacher và Student với roles tương ứng

## 4. Cấu hình môi trường

### 4.1. Biến môi trường Backend (.env)

Tạo file `backend/.env` với nội dung:

```
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gradeview
DB_USER=postgres
DB_PASSWORD=postgres
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=gradeview
KEYCLOAK_CLIENT_ID=gradeview-backend
KEYCLOAK_CLIENT_SECRET=<your-client-secret>
SESSION_SECRET=<random-session-secret>
```

Thay `<your-client-secret>` bằng Client Secret của `gradeview-backend` đã lấy từ Keycloak.

### 4.2. Biến môi trường Frontend

Các biến môi trường Frontend đã được cấu hình trong `docker-compose.yml`:

```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:5000/api
  - NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
  - NEXT_PUBLIC_KEYCLOAK_REALM=gradeview
  - NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=gradeview-frontend
```

## 5. Cấu hình tự động chuyển hướng sang Keycloak

Để tự động chuyển hướng người dùng chưa đăng nhập sang trang đăng nhập Keycloak, cần sửa đổi trang chủ:

1. Mở file `frontend/src/app/page.tsx`
2. Sửa file như sau:

```tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Nếu đã đăng nhập, chuyển đến dashboard
        router.push('/dashboard');
      } else {
        // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Hiển thị loading trong khi kiểm tra
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Trang này sẽ không hiển thị vì đã chuyển hướng
  return null;
}
```

3. Lưu file và build lại Docker image:

```bash
docker-compose down
docker-compose up -d --build
```

## 6. Cấu trúc API

### 6.1. API Endpoint

Tất cả API được tiền tố với `/api`:

- **Users API**:
  - `GET /api/users` - Lấy tất cả users
  - `GET /api/users/:id` - Lấy user theo ID
  - `GET /api/users/role/:role` - Lấy users theo role
  - `POST /api/users` - Tạo user mới
  - `PUT /api/users/:id` - Cập nhật user
  - `DELETE /api/users/:id` - Xóa user

- **Subjects API**:
  - `GET /api/subjects` - Lấy tất cả môn học
  - `GET /api/subjects/:id` - Lấy môn học theo ID
  - `POST /api/subjects` - Tạo môn học mới
  - `PUT /api/subjects/:id` - Cập nhật môn học
  - `DELETE /api/subjects/:id` - Xóa môn học
  - `POST /api/subjects/assign-teacher` - Gán giáo viên cho môn học
  - `GET /api/subjects/teacher/:teacherId` - Lấy môn học của giáo viên
  - `POST /api/subjects/enroll-student` - Đăng ký học sinh cho môn học
  - `GET /api/subjects/student/:studentId` - Lấy môn học của học sinh

- **Grades API**:
  - `GET /api/grades/student/:studentId` - Lấy tất cả điểm của học sinh
  - `GET /api/grades/student/:studentId/subject/:subjectId` - Lấy điểm học sinh theo môn học
  - `GET /api/grades/teacher/:teacherId/subject/:subjectId` - Lấy điểm của môn học giáo viên dạy
  - `POST /api/grades` - Thêm điểm mới
  - `PUT /api/grades/:id` - Cập nhật điểm
  - `DELETE /api/grades/:id` - Xóa điểm

### 6.2. Luồng xác thực

1. Người dùng truy cập ứng dụng
2. Nếu chưa đăng nhập, tự động chuyển hướng đến trang đăng nhập
3. Trang đăng nhập chuyển hướng đến Keycloak
4. Người dùng đăng nhập thành công trên Keycloak
5. Keycloak chuyển hướng về ứng dụng với token
6. Frontend lưu token và thông tin người dùng
7. Frontend sử dụng token để gọi API Backend
8. Backend xác thực token với Keycloak trước khi xử lý yêu cầu

## 7. Xử lý lỗi thường gặp

### 7.1. Keycloak không khởi động

Kiểm tra:
- Port 8080 đã được sử dụng bởi ứng dụng khác
- Dừng container đang sử dụng port 8080: `docker stop <container-id>`

### 7.2. Không thể đăng nhập Keycloak

- Kiểm tra realm name có chính xác là `gradeview`
- Đảm bảo client ID khớp với cấu hình
- Xác nhận URL redirect đã được cấu hình đúng

### 7.3. API gọi không thành công

- Kiểm tra token có được gửi đúng cách
- Xem logs backend để tìm lỗi: `docker logs grade_view-backend-1`
- Đảm bảo client secret của backend đã được cấu hình chính xác

### 7.4. Không chuyển hướng tự động sang Keycloak

- Kiểm tra file `page.tsx` đã được cập nhật
- Đảm bảo đã build lại ứng dụng sau khi thay đổi
- Xóa cache trình duyệt

## 8. Phát triển và mở rộng

### 8.1. Thêm client mới vào Keycloak

1. Truy cập Keycloak Admin Console
2. Chọn realm `gradeview`
3. Tạo client mới với các bước tương tự như trên
4. Cập nhật cấu hình trong ứng dụng tương ứng

### 8.2. Thêm role mới

1. Truy cập Keycloak Admin Console
2. Chọn "Realm roles"
3. Tạo role mới
4. Cập nhật logic phân quyền trong ứng dụng

### 8.3. Phát triển trong môi trường local

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

## 9. Tài liệu tham khảo

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

Với README này, bạn có thể dễ dàng thiết lập, cấu hình và sử dụng hệ thống GradeView với xác thực Keycloak và lưu trữ dữ liệu trong PostgreSQL.


# GIAI THICH DU AN

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