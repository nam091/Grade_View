TRUNCATE TABLE subjects CASCADE; 

-- Insert subjects (giữ nguyên phần này)
INSERT INTO subjects (name, code, credits, "createdAt", "updatedAt")
VALUES 
  ('Toán cao cấp', 'MATH101', 3, NOW(), NOW()),
  ('Vật lý đại cương', 'PHYS101', 3, NOW(), NOW()),
  ('Cơ sở dữ liệu', 'CS101', 3, NOW(), NOW()),
  ('Triết học', 'PHIL101', 3, NOW(), NOW()),
  ('Lập trình căn bản', 'WEB101', 3, NOW(), NOW()),
  ('Tiếng Anh cơ bản', 'ENG101', 3, NOW(), NOW()),
  ('Tiếng Anh chuyên ngành', 'ENG201', 3, NOW(), NOW()),
  ('Hệ điều hành', 'OS101', 3, NOW(), NOW()),
  ('Mạng máy tính', 'NET101', 3, NOW(), NOW()),
  ('Trí tuệ nhân tạo', 'AI101', 3, NOW(), NOW());

-- Thêm comment để giải thích
-- LƯU Ý: Dữ liệu người dùng sẽ được tạo thông qua Keycloak hoặc trang web
-- Các bảng liên quan đến người dùng như teacher_subject_assignments, student_enrollments, grades
-- sẽ được điền sau khi có người dùng thực trong hệ thống 