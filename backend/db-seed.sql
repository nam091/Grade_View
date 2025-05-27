-- Xóa dữ liệu từ bảng subjects nhưng giữ lại ID để tránh xung đột với dữ liệu liên kết hiện có
-- Cách này an toàn hơn vì nó không làm mất liên kết với các bảng khác
DELETE FROM subjects WHERE TRUE;

-- Nếu bạn muốn reset ID sequence, hãy bỏ comment dòng dưới đây
-- Lưu ý: Điều này có thể gây ra xung đột với dữ liệu hiện có nếu có tham chiếu
-- ALTER SEQUENCE subjects_id_seq RESTART WITH 1;

-- Insert subjects
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