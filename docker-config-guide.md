# Hướng dẫn cấu hình Docker cho GradeView

## Cập nhật file .env

Sao chép nội dung sau vào file `.env` của bạn:

```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gradeview
DB_USER=postgres
DB_PASSWORD=3147
KC_DB=postgres

# Keycloak setup
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=gradeview
KEYCLOAK_CLIENT_ID=gradeview-backend
NEXT_PUBLIC_KEYCLOAK_ID=gradeview-frontend
# Đặt các client secret sau khi tạo trong Keycloak
KEYCLOAK_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
SESSION_SECRET=YOUR_SESSION_SECRET_HERE

# Keycloak admin
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# Keycloak database
KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak

# Backend
BACKEND_PORT=5000
BACKEND_URL_API=http://backend:5000/api

# Frontend
FRONTEND_PORT=3000
FRONTEND_URL_API=http://backend:5000/api
```

## Sau khi cài đặt Docker

1. Sau khi ứng dụng đã chạy, truy cập trang quản trị Keycloak:
   - URL: http://localhost:8080/admin
   - Username: admin
   - Password: admin

2. Cấu hình Client `gradeview-frontend` trong realm `gradeview`:
   - Vào "Clients" > "gradeview-frontend"
   - Trong tab "Settings":
     - Valid Redirect URIs: `http://localhost:3000/*`
     - Web Origins: `http://localhost:3000` (hoặc dùng `+` để cho phép tất cả)
   - Trong tab "Client Scopes" > Default Client Scopes:
     - Đảm bảo `roles` và `profile` đã được thêm vào "Assigned Default Client Scopes"

3. Cấu hình Client `gradeview-backend` trong realm `gradeview`:
   - Vào "Clients" > "gradeview-backend"
   - Lấy Client Secret từ tab "Credentials" và cập nhật giá trị KEYCLOAK_CLIENT_SECRET trong `.env`
   - Trong tab "Settings":
     - Access Type: confidential
     - Service Accounts Enabled: ON

4. Khởi động lại container:
   ```
   docker-compose down
   docker-compose up -d
   ```

## Khắc phục sự cố

Nếu vẫn gặp vòng lặp vô hạn khi đăng nhập:

1. Kiểm tra logs container:
   ```
   docker-compose logs frontend
   docker-compose logs keycloak
   ```

2. Xóa cache trình duyệt và cookie, đặc biệt là cookie Keycloak.

3. Đảm bảo tên miền khớp giữa URL trên trình duyệt và cấu hình Keycloak.

4. Kiểm tra mapping giữa cổng trong Docker và máy chủ: các cổng 3000, 5000, 8080 nên được chuyển tiếp chính xác. 