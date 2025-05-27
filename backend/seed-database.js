const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * SEED DATABASE SCRIPT
 * 
 * CHÚ Ý: Script này chỉ khởi tạo dữ liệu môn học.
 * Dữ liệu người dùng (admin, giáo viên, học sinh) sẽ được tạo thông qua:
 * 1. Đăng ký trực tiếp trên ứng dụng web
 * 2. Tạo người dùng trong Keycloak
 * 
 * Các bảng liên quan đến người dùng như teacher_subject_assignments, 
 * student_enrollments, grades sẽ được điền sau khi có người dùng thực trong hệ thống.
 */

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gradeview',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '3147'
});

async function seedDatabase() {
  console.log('Seeding database with subject data only...');
  
  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'db-seed.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute the SQL script
      await client.query(sqlContent);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Database seeded successfully with subject data!');
      console.log('NOTE: User data should be created through Keycloak or the web application.');
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error seeding database:', error);
    } finally {
      // Release client
      client.release();
    }
  } catch (error) {
    console.error('Error reading SQL file:', error);
  } finally {
    // End pool
    await pool.end();
  }
}

// Run the seed function
seedDatabase(); 