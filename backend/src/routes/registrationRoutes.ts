import express from 'express';
import {
  createRegistrationRequest,
  getAllRegistrationRequests,
  getStudentRegistrationRequests,
  processRegistrationRequest,
  getAvailableSubjectsForStudent
} from '../controllers/registrationController';

const router = express.Router();

// Sinh viên tạo yêu cầu đăng ký môn học
router.post('/', createRegistrationRequest);

// Admin lấy tất cả yêu cầu đăng ký
router.get('/', getAllRegistrationRequests);

// Sinh viên lấy yêu cầu đăng ký của mình
router.get('/student/:studentId', getStudentRegistrationRequests);

// Admin phê duyệt/từ chối yêu cầu đăng ký
router.put('/:id/process', processRegistrationRequest);

// Lấy danh sách môn học có thể đăng ký cho sinh viên
router.get('/available-subjects/:studentId', getAvailableSubjectsForStudent);

export default router; 