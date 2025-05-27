import express from 'express';
import {
  addGrade,
  updateGrade,
  deleteGrade,
  getStudentGradesBySubject,
  getAllStudentGrades,
  getTeacherSubjectGrades
} from '../controllers/gradeController';

const router = express.Router();

// Grade CRUD
router.post('/', addGrade);
router.put('/:id', updateGrade);
router.delete('/:id', deleteGrade);

// Student grade reports
router.get('/student/:studentId/subject/:subjectId', getStudentGradesBySubject);
router.get('/student/:studentId', getAllStudentGrades);

// Teacher grade management
router.get('/teacher/:teacherId/subject/:subjectId', getTeacherSubjectGrades);

export default router; 