#!/bin/bash
# Script đơn giản để chạy GradeView

echo "Khởi động GradeView..."

# Tạo thư mục logs
mkdir -p logs

# Đặt biến môi trường
export PGPASSWORD="3147"
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"

echo "1. Khởi động Keycloak..."
cd keycloak-26.2.4/bin
./kc.sh start-dev --http-port=8080 > ../../logs/keycloak.log 2>&1 &
cd ../..

echo "2. Chờ Keycloak (30s)..."
sleep 30

echo "3. Khởi động Backend..."
cd backend
npm start > ../logs/backend.log 2>&1 &
cd ..

echo "4. Chờ Backend (10s)..."
sleep 10

echo "5. Khởi động Frontend..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
cd ..

echo ""
echo "Hoàn tất! Các dịch vụ đang chạy:"
echo "- Keycloak: http://localhost:8080"
echo "- Backend: http://localhost:5000"
echo "- Frontend: http://localhost:3000"

echo ""
echo "Nhấn Enter để thoát..."
read

# Dừng tất cả
echo "Đang dừng dịch vụ..."
pkill -f "java.*keycloak"
pkill -f "node.*npm"
echo "Đã dừng!"
