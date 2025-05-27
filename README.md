
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
