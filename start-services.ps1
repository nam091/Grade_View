# Script chạy tất cả dịch vụ của GradeView
# Chạy bằng cách: .\start-services.ps1

# Tạo thư mục logs nếu chưa tồn tại
if (-not (Test-Path -Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs"
}

# Kiểm tra PostgreSQL đã được cài đặt chưa
function Test-PostgreSQL {
    try {
        $pgVersion = (& psql --version) 2>$null
        if ($pgVersion) {
            Write-Host "PostgreSQL đã được cài đặt: $pgVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "PostgreSQL chưa được cài đặt hoặc không có trong PATH" -ForegroundColor Yellow
        return $false
    }
}

# Kiểm tra Keycloak
function Test-Keycloak {
    if (Test-Path -Path ".\keycloak-26.2.4\bin\kc.bat") {
        Write-Host "Keycloak được tìm thấy" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Không tìm thấy Keycloak trong thư mục keycloak-26.2.4" -ForegroundColor Yellow
        return $false
    }
}

# Kiểm tra Node.js
function Test-NodeJS {
    try {
        $nodeVersion = (& node --version) 2>$null
        if ($nodeVersion) {
            Write-Host "Node.js đã được cài đặt: $nodeVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "Node.js chưa được cài đặt hoặc không có trong PATH" -ForegroundColor Yellow
        return $false
    }
}

# Kiểm tra môi trường
if (-not (Test-PostgreSQL)) {
    Write-Host "Vui lòng cài đặt PostgreSQL trước khi chạy script này" -ForegroundColor Red
    exit
}

if (-not (Test-Keycloak)) {
    Write-Host "Vui lòng đảm bảo Keycloak được giải nén đúng vị trí" -ForegroundColor Red
    exit
}

if (-not (Test-NodeJS)) {
    Write-Host "Vui lòng cài đặt Node.js trước khi chạy script này" -ForegroundColor Red
    exit
}

# Tạo và cấu hình cơ sở dữ liệu
function Setup-Database {
    Write-Host "Chuẩn bị cơ sở dữ liệu..." -ForegroundColor Cyan
    
    # Kiểm tra cơ sở dữ liệu gradeview
    $dbExists = $false
    $result = (& psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='gradeview'" -t) 2>$null
    if ($result -and $result.Trim() -eq "1") {
        $dbExists = $true
        Write-Host "Cơ sở dữ liệu gradeview đã tồn tại" -ForegroundColor Green
    }
    
    if (-not $dbExists) {
        Write-Host "Tạo cơ sở dữ liệu gradeview..." -ForegroundColor Yellow
        & psql -U postgres -c "CREATE DATABASE gradeview"
    }
    
    # Kiểm tra cơ sở dữ liệu keycloak
    $dbExists = $false
    $result = (& psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='keycloak'" -t) 2>$null
    if ($result -and $result.Trim() -eq "1") {
        $dbExists = $true
        Write-Host "Cơ sở dữ liệu keycloak đã tồn tại" -ForegroundColor Green
    }
    
    if (-not $dbExists) {
        Write-Host "Tạo cơ sở dữ liệu keycloak..." -ForegroundColor Yellow
        & psql -U postgres -c "CREATE DATABASE keycloak"
    }
}

# Chạy Keycloak
function Start-Keycloak {
    Write-Host "Khởi động Keycloak..." -ForegroundColor Cyan
    
    $env:KC_DB="postgres"
    $env:KC_DB_URL="jdbc:postgresql://localhost:5432/keycloak"
    $env:KC_DB_USERNAME="postgres"
    $env:KC_DB_PASSWORD="3147"
    $env:KEYCLOAK_ADMIN="admin"
    $env:KEYCLOAK_ADMIN_PASSWORD="admin"
    
    $keycloakProcess = Start-Process -FilePath ".\keycloak-26.2.4\bin\kc.bat" -ArgumentList "start-dev", "--import-realm", "--http-port=8080" -PassThru -NoNewWindow -RedirectStandardOutput ".\logs\keycloak.log"
    return $keycloakProcess
}

# Chạy Backend
function Start-Backend {
    Write-Host "Khởi động Backend..." -ForegroundColor Cyan
    
    # Đặt biến môi trường cho Backend
    $env:PORT="5000"
    $env:DB_HOST="localhost"
    $env:DB_PORT="5432"
    $env:DB_NAME="gradeview"
    $env:DB_USER="postgres"
    $env:DB_PASSWORD="3147"
    $env:KEYCLOAK_URL="http://localhost:8080"
    $env:KEYCLOAK_REALM="gradeview"
    $env:KEYCLOAK_CLIENT_ID="gradeview-backend"
    
    Push-Location ".\backend"
    
    # Kiểm tra node_modules
    if (-not (Test-Path -Path ".\node_modules")) {
        Write-Host "Cài đặt dependencies cho Backend..." -ForegroundColor Yellow
        & npm install
    }
    
    $backendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow -RedirectStandardOutput "..\logs\backend.log"
    
    Pop-Location
    return $backendProcess
}

# Chạy Frontend
function Start-Frontend {
    Write-Host "Khởi động Frontend..." -ForegroundColor Cyan
    
    # Đặt biến môi trường cho Frontend
    $env:PORT="3000"
    $env:NEXT_PUBLIC_API_URL="http://localhost:5000/api"
    $env:NEXT_PUBLIC_KEYCLOAK_URL="http://localhost:8080"
    $env:NEXT_PUBLIC_KEYCLOAK_REALM="gradeview"
    $env:NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="gradeview-frontend"
    
    Push-Location ".\frontend"
    
    # Kiểm tra node_modules
    if (-not (Test-Path -Path ".\node_modules")) {
        Write-Host "Cài đặt dependencies cho Frontend..." -ForegroundColor Yellow
        & npm install
    }
    
    $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow -RedirectStandardOutput "..\logs\frontend.log"
    
    Pop-Location
    return $frontendProcess
}

# Chạy tất cả dịch vụ
Write-Host "===== Bắt đầu khởi động tất cả dịch vụ GradeView =====" -ForegroundColor Magenta

# Chuẩn bị cơ sở dữ liệu
Setup-Database

# Chạy Keycloak
$keycloakProcess = Start-Keycloak

# Đợi Keycloak khởi động
Write-Host "Đợi Keycloak khởi động (30 giây)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Chạy Backend
$backendProcess = Start-Backend

# Đợi Backend khởi động
Write-Host "Đợi Backend khởi động (10 giây)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Chạy Frontend
$frontendProcess = Start-Frontend

Write-Host "`nTất cả dịch vụ đã được khởi động!" -ForegroundColor Green
Write-Host "Keycloak: http://localhost:8080 (Admin Console: http://localhost:8080/admin)" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nLogs được lưu trong thư mục ./logs" -ForegroundColor Cyan
Write-Host "`nẤn Ctrl+C để dừng tất cả dịch vụ" -ForegroundColor Yellow

# Theo dõi và đợi người dùng dừng script
try {
    # Đợi người dùng nhấn Ctrl+C
    Wait-Event -Timeout ([int]::MaxValue)
} 
finally {
    # Dừng các tiến trình khi người dùng dừng script
    Write-Host "`nĐang dừng tất cả dịch vụ..." -ForegroundColor Magenta
    
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
        Write-Host "Đã dừng Frontend" -ForegroundColor Green
    }
    
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force
        Write-Host "Đã dừng Backend" -ForegroundColor Green
    }
    
    if ($keycloakProcess -and -not $keycloakProcess.HasExited) {
        Stop-Process -Id $keycloakProcess.Id -Force
        Write-Host "Đã dừng Keycloak" -ForegroundColor Green
    }
    
    Write-Host "Tất cả dịch vụ đã được dừng thành công" -ForegroundColor Green
} 