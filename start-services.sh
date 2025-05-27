#!/bin/bash

# Script chạy tất cả dịch vụ của GradeView trên Linux
# Chạy bằng cách: bash start-services.sh hoặc ./start-services.sh

# Màu cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Tạo thư mục logs nếu chưa tồn tại
if [ ! -d "./logs" ]; then
    mkdir -p ./logs
    echo -e "${GREEN}Đã tạo thư mục logs${NC}"
fi

# Kiểm tra PostgreSQL đã được cài đặt chưa
test_postgresql() {
    if command -v psql &> /dev/null; then
        pg_version=$(psql --version)
        echo -e "${GREEN}PostgreSQL đã được cài đặt: ${pg_version}${NC}"
        return 0
    else
        echo -e "${YELLOW}PostgreSQL chưa được cài đặt hoặc không có trong PATH${NC}"
        return 1
    fi
}

# Kiểm tra Keycloak
test_keycloak() {
    if [ -f "./keycloak-26.2.4/bin/kc.sh" ]; then
        echo -e "${GREEN}Keycloak được tìm thấy${NC}"
        return 0
    else
        echo -e "${YELLOW}Không tìm thấy Keycloak trong thư mục keycloak-26.2.4${NC}"
        return 1
    fi
}

# Kiểm tra Node.js
test_nodejs() {
    if command -v node &> /dev/null; then
        node_version=$(node --version)
        echo -e "${GREEN}Node.js đã được cài đặt: ${node_version}${NC}"
        return 0
    else
        echo -e "${YELLOW}Node.js chưa được cài đặt hoặc không có trong PATH${NC}"
        return 1
    fi
}

# Kiểm tra môi trường
if ! test_postgresql; then
    echo -e "${RED}Vui lòng cài đặt PostgreSQL trước khi chạy script này${NC}"
    exit 1
fi

if ! test_keycloak; then
    echo -e "${RED}Vui lòng đảm bảo Keycloak được giải nén đúng vị trí${NC}"
    exit 1
fi

if ! test_nodejs; then
    echo -e "${RED}Vui lòng cài đặt Node.js trước khi chạy script này${NC}"
    exit 1
fi

# Tạo và cấu hình cơ sở dữ liệu
setup_database() {
    echo -e "${CYAN}Chuẩn bị cơ sở dữ liệu...${NC}"
    
    # Kiểm tra cơ sở dữ liệu gradeview
    db_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gradeview'" 2>/dev/null)
    
    if [ "$db_exists" = "1" ]; then
        echo -e "${GREEN}Cơ sở dữ liệu gradeview đã tồn tại${NC}"
    else
        echo -e "${YELLOW}Tạo cơ sở dữ liệu gradeview...${NC}"
        psql -U postgres -c "CREATE DATABASE gradeview"
    fi
    
    # Kiểm tra cơ sở dữ liệu keycloak
    db_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='keycloak'" 2>/dev/null)
    
    if [ "$db_exists" = "1" ]; then
        echo -e "${GREEN}Cơ sở dữ liệu keycloak đã tồn tại${NC}"
    else
        echo -e "${YELLOW}Tạo cơ sở dữ liệu keycloak...${NC}"
        psql -U postgres -c "CREATE DATABASE keycloak"
    fi
}

# Chạy db-seed.sql để khởi tạo dữ liệu môn học
run_db_seed() {
    echo -e "${CYAN}Chạy db-seed.sql để khởi tạo dữ liệu môn học...${NC}"
    
    if [ -f "./backend/db-seed.sql" ]; then
        echo -e "${YELLOW}Nhập dữ liệu môn học vào database gradeview...${NC}"
        psql -U postgres -d gradeview -f "./backend/db-seed.sql"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Đã nhập dữ liệu môn học thành công!${NC}"
        else
            echo -e "${RED}Lỗi khi nhập dữ liệu môn học!${NC}"
        fi
    else
        echo -e "${RED}Không tìm thấy file ./backend/db-seed.sql!${NC}"
    fi
}

# Chạy psql với database đã chọn
run_psql() {
    echo -e "${CYAN}Chọn database để kết nối:${NC}"
    echo -e "1) gradeview"
    echo -e "2) keycloak"
    echo -e "3) postgres (default)"
    echo -e "4) Quay lại"
    
    read -p "Nhập lựa chọn (1-4): " db_choice
    
    case $db_choice in
        1)
            echo -e "${YELLOW}Kết nối đến database gradeview...${NC}"
            psql -U postgres -d gradeview
            ;;
        2)
            echo -e "${YELLOW}Kết nối đến database keycloak...${NC}"
            psql -U postgres -d keycloak
            ;;
        3)
            echo -e "${YELLOW}Kết nối đến database postgres...${NC}"
            psql -U postgres
            ;;
        4)
            echo -e "${YELLOW}Quay lại menu chính...${NC}"
            return
            ;;
        *)
            echo -e "${RED}Lựa chọn không hợp lệ!${NC}"
            ;;
    esac
    
    # Hiển thị menu chính sau khi thoát psql
    show_main_menu
}

# Nhập SQL script vào database
import_sql_script() {
    echo -e "${CYAN}Chọn database để nhập SQL script:${NC}"
    echo -e "1) gradeview"
    echo -e "2) keycloak"
    echo -e "3) postgres (default)"
    echo -e "4) Quay lại"
    
    read -p "Nhập lựa chọn (1-4): " db_choice
    
    if [ "$db_choice" = "4" ]; then
        echo -e "${YELLOW}Quay lại menu chính...${NC}"
        return
    fi
    
    read -p "Nhập đường dẫn đến file SQL script: " sql_file
    
    if [ ! -f "$sql_file" ]; then
        echo -e "${RED}File không tồn tại!${NC}"
        return
    fi
    
    case $db_choice in
        1)
            echo -e "${YELLOW}Nhập script vào database gradeview...${NC}"
            psql -U postgres -d gradeview -f "$sql_file"
            ;;
        2)
            echo -e "${YELLOW}Nhập script vào database keycloak...${NC}"
            psql -U postgres -d keycloak -f "$sql_file"
            ;;
        3)
            echo -e "${YELLOW}Nhập script vào database postgres...${NC}"
            psql -U postgres -f "$sql_file"
            ;;
        *)
            echo -e "${RED}Lựa chọn không hợp lệ!${NC}"
            ;;
    esac
    
    # Hiển thị menu chính sau khi hoàn thành
    show_main_menu
}

# Hiển thị menu chính
show_main_menu() {
    while true; do
        echo -e "\n${CYAN}=== MENU QUẢN LÝ GRADEVIEW ===${NC}"
        echo -e "1) Kết nối đến database với psql"
        echo -e "2) Nhập SQL script vào database"
        echo -e "3) Chạy db-seed.sql (khởi tạo dữ liệu môn học)"
        echo -e "4) Xem logs"
        echo -e "5) Khởi động lại dịch vụ"
        echo -e "6) Thoát và dừng tất cả dịch vụ"
        
        read -p "Nhập lựa chọn (1-6): " choice
        
        case $choice in
            1)
                run_psql
                ;;
            2)
                import_sql_script
                ;;
            3)
                run_db_seed
                ;;
            4)
                echo -e "${CYAN}Chọn log để xem:${NC}"
                echo -e "1) Keycloak"
                echo -e "2) Backend"
                echo -e "3) Frontend"
                echo -e "4) Quay lại"
                
                read -p "Nhập lựa chọn (1-4): " log_choice
                
                case $log_choice in
                    1)
                        echo -e "${YELLOW}Hiển thị log Keycloak:${NC}"
                        tail -f ./logs/keycloak.log
                        ;;
                    2)
                        echo -e "${YELLOW}Hiển thị log Backend:${NC}"
                        tail -f ./logs/backend.log
                        ;;
                    3)
                        echo -e "${YELLOW}Hiển thị log Frontend:${NC}"
                        tail -f ./logs/frontend.log
                        ;;
                    4)
                        continue
                        ;;
                    *)
                        echo -e "${RED}Lựa chọn không hợp lệ!${NC}"
                        ;;
                esac
                ;;
            5)
                echo -e "${YELLOW}Đang khởi động lại tất cả dịch vụ...${NC}"
                
                # Dừng dịch vụ hiện tại
                if [ ! -z "$frontend_pid" ]; then
                    kill -9 $frontend_pid 2>/dev/null
                    echo -e "${GREEN}Đã dừng Frontend${NC}"
                fi
                
                if [ ! -z "$backend_pid" ]; then
                    kill -9 $backend_pid 2>/dev/null
                    echo -e "${GREEN}Đã dừng Backend${NC}"
                fi
                
                if [ ! -z "$keycloak_pid" ]; then
                    kill -9 $keycloak_pid 2>/dev/null
                    echo -e "${GREEN}Đã dừng Keycloak${NC}"
                fi
                
                # Khởi động lại dịch vụ
                start_keycloak
                keycloak_pid=$?
                
                echo -e "${YELLOW}Đợi Keycloak khởi động (30 giây)...${NC}"
                sleep 30
                
                start_backend
                backend_pid=$?
                
                echo -e "${YELLOW}Đợi Backend khởi động (10 giây)...${NC}"
                sleep 10
                
                start_frontend
                frontend_pid=$?
                
                echo -e "${GREEN}Tất cả dịch vụ đã được khởi động lại!${NC}"
                ;;
            6)
                stop_services
                ;;
            *)
                echo -e "${RED}Lựa chọn không hợp lệ!${NC}"
                ;;
        esac
    done
}

# Chạy Keycloak
start_keycloak() {
    echo -e "${CYAN}Khởi động Keycloak...${NC}"
    
    export KC_DB="postgres"
    export KC_DB_URL="jdbc:postgresql://localhost:5432/keycloak"
    export KC_DB_USERNAME="postgres"
    export KC_DB_PASSWORD="3147"
    export KEYCLOAK_ADMIN="admin"
    export KEYCLOAK_ADMIN_PASSWORD="admin"
    
    # Cấp quyền thực thi cho kc.sh nếu cần
    chmod +x ./keycloak-26.2.4/bin/kc.sh
    
    # Chạy Keycloak trong background và ghi log
    ./keycloak-26.2.4/bin/kc.sh start-dev --import-realm --http-port=8080 > ./logs/keycloak.log 2>&1 &
    keycloak_pid=$!
    
    echo "Keycloak PID: $keycloak_pid"
    return $keycloak_pid
}

# Chạy Backend
start_backend() {
    echo -e "${CYAN}Khởi động Backend...${NC}"
    
    # Đặt biến môi trường cho Backend
    export PORT="5000"
    export DB_HOST="localhost"
    export DB_PORT="5432"
    export DB_NAME="gradeview"
    export DB_USER="postgres"
    export DB_PASSWORD="3147"
    export KEYCLOAK_URL="http://localhost:8080"
    export KEYCLOAK_REALM="gradeview"
    export KEYCLOAK_CLIENT_ID="gradeview-backend"
    
    cd ./backend
    
    # Kiểm tra node_modules
    if [ ! -d "./node_modules" ]; then
        echo -e "${YELLOW}Cài đặt dependencies cho Backend...${NC}"
        npm install
    fi
    
    # Chạy backend trong background và ghi log
    npm start > ../logs/backend.log 2>&1 &
    backend_pid=$!
    
    # Quay lại thư mục gốc
    cd ..
    
    echo "Backend PID: $backend_pid"
    return $backend_pid
}

# Chạy Frontend
start_frontend() {
    echo -e "${CYAN}Khởi động Frontend...${NC}"
    
    # Đặt biến môi trường cho Frontend
    export PORT="3000"
    export NEXT_PUBLIC_API_URL="http://localhost:5000/api"
    export NEXT_PUBLIC_KEYCLOAK_URL="http://localhost:8080"
    export NEXT_PUBLIC_KEYCLOAK_REALM="gradeview"
    export NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="gradeview-frontend"
    
    cd ./frontend
    
    # Kiểm tra node_modules
    if [ ! -d "./node_modules" ]; then
        echo -e "${YELLOW}Cài đặt dependencies cho Frontend...${NC}"
        npm install
    fi
    
    # Chạy frontend trong background và ghi log
    npm run dev > ../logs/frontend.log 2>&1 &
    frontend_pid=$!
    
    # Quay lại thư mục gốc
    cd ..
    
    echo "Frontend PID: $frontend_pid"
    return $frontend_pid
}

# Dừng dịch vụ
stop_services() {
    echo -e "${MAGENTA}Đang dừng tất cả dịch vụ...${NC}"
    
    if [ ! -z "$frontend_pid" ]; then
        kill -9 $frontend_pid 2>/dev/null
        echo -e "${GREEN}Đã dừng Frontend${NC}"
    fi
    
    if [ ! -z "$backend_pid" ]; then
        kill -9 $backend_pid 2>/dev/null
        echo -e "${GREEN}Đã dừng Backend${NC}"
    fi
    
    if [ ! -z "$keycloak_pid" ]; then
        kill -9 $keycloak_pid 2>/dev/null
        echo -e "${GREEN}Đã dừng Keycloak${NC}"
    fi
    
    echo -e "${GREEN}Tất cả dịch vụ đã được dừng thành công${NC}"
    exit 0
}

# Bắt signal SIGINT (Ctrl+C) và SIGTERM
trap stop_services SIGINT SIGTERM

# Chạy tất cả dịch vụ
echo -e "${MAGENTA}===== Bắt đầu khởi động tất cả dịch vụ GradeView =====${NC}"

# Chuẩn bị cơ sở dữ liệu
setup_database

# Chạy Keycloak
start_keycloak
keycloak_pid=$?

# Đợi Keycloak khởi động
echo -e "${YELLOW}Đợi Keycloak khởi động (30 giây)...${NC}"
sleep 30

# Chạy Backend
start_backend
backend_pid=$?

# Đợi Backend khởi động
echo -e "${YELLOW}Đợi Backend khởi động (10 giây)...${NC}"
sleep 10

# Chạy Frontend
start_frontend
frontend_pid=$?

echo -e "${GREEN}Tất cả dịch vụ đã được khởi động!${NC}"
echo -e "${CYAN}Keycloak: http://localhost:8080 (Admin Console: http://localhost:8080/admin)${NC}"
echo -e "${CYAN}Backend: http://localhost:5000${NC}"
echo -e "${CYAN}Frontend: http://localhost:3000${NC}"
echo -e "${CYAN}Logs được lưu trong thư mục ./logs${NC}"

# Hiển thị menu chính
show_main_menu 