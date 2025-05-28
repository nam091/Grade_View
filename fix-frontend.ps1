# Script khắc phục vấn đề Frontend
Write-Host "Khắc phục vấn đề Frontend..." -ForegroundColor Yellow

cd frontend

Write-Host "1. Kiểm tra Node.js version..." -ForegroundColor Cyan
node --version
npm --version

Write-Host "2. Xóa cache và node_modules..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue  
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

Write-Host "3. Cài đặt lại dependencies..." -ForegroundColor Cyan
npm install

Write-Host "4. Tạo .env.local..." -ForegroundColor Cyan
$envContent = @"
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=gradeview
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=gradeview-frontend
"@
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "5. Kiểm tra TypeScript..." -ForegroundColor Cyan
npm run typecheck

Write-Host "6. Thử chạy Frontend..." -ForegroundColor Green
npm run dev

cd .. 