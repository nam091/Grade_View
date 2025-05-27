-- Reset sequences and clean data
TRUNCATE users, subjects, teacher_subject_assignments, student_enrollments, grades RESTART IDENTITY CASCADE;

-- Insert users (admin, teachers, students)
INSERT INTO users ("keycloakId", name, email, role, "createdAt", "updatedAt")
VALUES 
  ('admin1-uuid', 'Admin One', 'admin1@example.com', 'admin', NOW(), NOW()),
  ('teacher1-uuid', 'Teacher One', 'teacher1@example.com', 'teacher', NOW(), NOW()),
  ('student1-uuid', 'Student One', 'student1@example.com', 'student', NOW(), NOW());

-- Insert subjects
INSERT INTO subjects (name, code, credits, "createdAt", "updatedAt")
VALUES 
  ('Toán cao cấp', 'MATH101', 3, NOW(), NOW()),
  ('Vật lý đại cương', 'PHYS101', 3, NOW(), NOW()),
  ('Cơ sở dữ liệu', 'CS101', 3, NOW(), NOW()),
  ('Triết học', 'PHIL101', 3, NOW(), NOW()),
  ('Lập trình căn bản', 'WEB101', 3, NOW(), NOW());

-- Assign teachers to subjects for the current academic year
INSERT INTO teacher_subject_assignments ("teacherId", "subjectId", "academicYear", "createdAt", "updatedAt")
VALUES 
  (2, 1, '2023-2024', NOW(), NOW()),  -- Teacher1 teaches Math
  (2, 2, '2023-2024', NOW(), NOW()),  -- Teacher1 teaches Physics
  (2, 3, '2023-2024', NOW(), NOW());  -- Teacher1 teaches CS

-- Enroll students in subjects
INSERT INTO student_enrollments ("studentId", "subjectId", "academicYear", "createdAt", "updatedAt")
VALUES 
  (3, 1, '2023-2024', NOW(), NOW()),  -- Student1 takes Math
  (3, 2, '2023-2024', NOW(), NOW()),  -- Student1 takes Physics
  (3, 3, '2023-2024', NOW(), NOW()),  -- Student1 takes CS
  (3, 4, '2023-2024', NOW(), NOW()),  -- Student1 takes Literature
  (3, 5, '2023-2024', NOW(), NOW());  -- Student1 takes History

-- Insert grades for the first term
INSERT INTO grades ("studentId", "subjectId", "teacherId", score, term, "academicYear", comment, "createdAt", "updatedAt")
VALUES 
  -- Student1's grades for term 1
  (3, 1, 2, 8.5, 'Học kỳ 1', '2023-2024', 'Hiểu bài tập tốt', NOW(), NOW()),
  (3, 2, 2, 7.8, 'Học kỳ 1', '2023-2024', 'Cần cải thiện kỹ năng giải quyết vấn đề', NOW(), NOW()),
  (3, 3, 2, 9.2, 'Học kỳ 1', '2023-2024', 'Kỹ năng lập trình tốt', NOW(), NOW()),
  (3, 4, 2, 8.0, 'Học kỳ 1', '2023-2024', 'Phân tích tốt nhưng cần thêm chiều sâu trong viết', NOW(), NOW()),
  (3, 5, 2, 7.5, 'Học kỳ 1', '2023-2024', 'Hiểu bài tập tốt', NOW(), NOW()),
  
  -- Student1's grades for term 2
  (3, 1, 2, 8.7, 'Học kỳ 2', '2023-2024', 'Cải thiện ứng dụng khái niệm', NOW(), NOW()),
  (3, 2, 2, 8.0, 'Học kỳ 2', '2023-2024', 'Phương pháp giải quyết vấn đề tốt hơn', NOW(), NOW()),
  (3, 3, 2, 9.5, 'Học kỳ 2', '2023-2024', 'Làm tốt bài tập', NOW(), NOW()),
  (3, 4, 2, 8.3, 'Học kỳ 2', '2023-2024', 'Phân tích tốt hơn trong bài viết', NOW(), NOW()),
  (3, 5, 2, 8.0, 'Học kỳ 2', '2023-2024', 'Hiểu bài tập tốt', NOW(), NOW());

-- You can add more data as needed 