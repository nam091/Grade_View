# Script đơn giản để chạy GradeView
Write-Host "Khởi động GradeView..." -ForegroundColor Green

# Tạo thư mục logs
if (-not (Test-Path "logs")) { mkdir logs }

# Đặt biến môi trường
$env:PGPASSWORD = "3147"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23"

Write-Host "1. Khởi động Keycloak..." -ForegroundColor Yellow
Start-Process -FilePath ".\keycloak-26.2.4\bin\kc.bat" -ArgumentList "start-dev", "--http-port=8080" -WindowStyle Minimized

Write-Host "2. Chờ Keycloak (30s)..." -ForegroundColor Yellow
Start-Sleep 30

Write-Host "3. Khởi động Backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd backend && npm start" -WindowStyle Minimized

Write-Host "4. Chờ Backend (10s)..." -ForegroundColor Yellow
Start-Sleep 10

Write-Host "5. Khởi động Frontend..." -ForegroundColor Yellow
Write-Host "   Nếu Frontend bị kẹt, hãy mở terminal mới và chạy:" -ForegroundColor Red
Write-Host "   cd frontend && npm install && npm run dev" -ForegroundColor Red

# Tạo file .env.local cho frontend
$envContent = @"
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=gradeview
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=gradeview-frontend
"@
$envContent | Out-File -FilePath "frontend\.env.local" -Encoding UTF8

Start-Process -FilePath "cmd" -ArgumentList "/c", "cd frontend && npm install && npm run dev" -WindowStyle Normal

Write-Host "`nHoàn tất! Các dịch vụ đang chạy:" -ForegroundColor Green
Write-Host "- Keycloak: http://localhost:8080" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:5000" -ForegroundColor Cyan  
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan

Write-Host "`nNếu Frontend không khởi động, kiểm tra cửa sổ terminal của nó!" -ForegroundColor Yellow
Write-Host "Nhấn phím bất kỳ để thoát..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Dừng tất cả
Write-Host "Đang dừng dịch vụ..." -ForegroundColor Red
Get-Process -Name "java", "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Đã dừng!" -ForegroundColor Green
