import express from 'express';
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  assignTeacherToSubject,
  getTeacherSubjects,
  enrollStudent,
  getStudentSubjects,
  getEnrolledStudents
} from '../controllers/subjectController';

const router = express.Router();

// Subject CRUD
router.post('/', createSubject);
router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

// Teacher assignment
router.post('/assign-teacher', assignTeacherToSubject);
router.get('/teacher/:teacherId', getTeacherSubjects);

// Student enrollment
router.post('/enroll-student', enrollStudent);
router.get('/student/:studentId', getStudentSubjects);
router.get('/:id/enrolled-students', getEnrolledStudents);

export default router; 