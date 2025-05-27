/**
 * SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU
 * 
 * Script này thực hiện:
 * 1. Tạo cơ sở dữ liệu nếu chưa tồn tại
 * 2. Tạo các bảng cần thiết
 * 3. Khởi tạo dữ liệu môn học
 * 
 * CHÚ Ý: Script này KHÔNG khởi tạo dữ liệu người dùng.
 * Dữ liệu người dùng (admin, giáo viên, học sinh) sẽ được tạo thông qua:
 * 1. Đăng ký trực tiếp trên ứng dụng web
 * 2. Tạo người dùng trong Keycloak
 */

const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'gradeview',
  DB_USER = 'postgres',
  DB_PASSWORD = '3147'
} = process.env;

// PostgreSQL connection cho cơ sở dữ liệu postgres (để tạo DB mới)
const pgPool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: 'postgres',
  user: DB_USER,
  password: DB_PASSWORD
});

// PostgreSQL connection cho gradeview (sau khi đã tạo)
const appPool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD
});

async function initDatabase() {
  console.log('=== BẮT ĐẦU QUÁ TRÌNH KHỞI TẠO CƠ SỞ DỮ LIỆU ===');

  try {
    // Bước 1: Tạo cơ sở dữ liệu nếu chưa tồn tại
    console.log(`\n1. Kiểm tra và tạo cơ sở dữ liệu "${DB_NAME}" nếu chưa tồn tại...`);
    const pgClient = await pgPool.connect();
    
    try {
      // Kiểm tra xem DB đã tồn tại chưa
      const checkResult = await pgClient.query(`
        SELECT 1 FROM pg_database WHERE datname = $1
      `, [DB_NAME]);

      if (checkResult.rows.length === 0) {
        // Tạo DB mới
        await pgClient.query(`CREATE DATABASE ${DB_NAME}`);
        console.log(`   ✓ Đã tạo cơ sở dữ liệu "${DB_NAME}" thành công.`);
      } else {
        console.log(`   ✓ Cơ sở dữ liệu "${DB_NAME}" đã tồn tại, bỏ qua bước tạo.`);
      }
    } finally {
      pgClient.release();
    }

    // Bước 2: Đồng bộ mô hình với cơ sở dữ liệu (tạo các bảng)
    console.log('\n2. Đồng bộ mô hình để tạo các bảng...');
    try {
      // Gọi script đồng bộ mô hình (sync-models)
      console.log('   Đang chạy npm run build để biên dịch TypeScript...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('   Đang chạy sync-models để tạo các bảng...');
      const { syncModels } = require('./dist/models/index');
      await syncModels();
      console.log('   ✓ Đã đồng bộ các mô hình thành công.');
    } catch (error) {
      console.error('   ✗ Lỗi khi đồng bộ mô hình:', error);
      throw error;
    }

    // Bước 3: Khởi tạo dữ liệu môn học
    console.log('\n3. Khởi tạo dữ liệu môn học...');
    try {
      // Chạy script seed data
      const sqlFilePath = path.join(__dirname, 'db-seed.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      const appClient = await appPool.connect();
      try {
        await appClient.query('BEGIN');
        await appClient.query(sqlContent);
        await appClient.query('COMMIT');
        console.log('   ✓ Đã khởi tạo dữ liệu môn học thành công.');
      } catch (error) {
        await appClient.query('ROLLBACK');
        console.error('   ✗ Lỗi khi khởi tạo dữ liệu môn học:', error);
        throw error;
      } finally {
        appClient.release();
      }
    } catch (error) {
      console.error('   ✗ Lỗi khi đọc hoặc thực thi file SQL:', error);
      throw error;
    }

    console.log('\n=== KHỞI TẠO CƠ SỞ DỮ LIỆU HOÀN TẤT ===');
    console.log('\nLƯU Ý:');
    console.log('- Dữ liệu người dùng cần được tạo thông qua Keycloak hoặc đăng ký trên trang web');
    console.log('- Các dữ liệu khác như đăng ký môn học, điểm số sẽ được tạo sau khi có người dùng');
  } catch (error) {
    console.error('\n=== LỖI KHỞI TẠO CƠ SỞ DỮ LIỆU ===', error);
  } finally {
    await pgPool.end();
    await appPool.end();
  }
}

// Chạy hàm khởi tạo
initDatabase(); 