import { Request, Response } from 'express';
import { Grade, User, Subject, TeacherSubjectAssignment } from '../models';
import { GradeInput } from '../models/Grade';

// Add a grade for a student
export const addGrade = async (req: Request, res: Response) => {
  try {
    const gradeData: GradeInput = req.body;
    const { studentId, subjectId, teacherId } = gradeData;
    
    // Check if student exists and is a student
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Sinh viên không tồn tại' });
    }
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User không phải là sinh viên' });
    }
    
    // Check if teacher exists and is a teacher
    const teacher = await User.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Giáo viên không tồn tại' });
    }
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User không phải là giáo viên' });
    }
    
    // Check if subject exists
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    // Check if teacher is assigned to this subject
    const teacherAssignment = await TeacherSubjectAssignment.findOne({
      where: {
        teacherId,
        subjectId,
        academicYear: gradeData.academicYear
      }
    });
    
    if (!teacherAssignment) {
      return res.status(403).json({ message: 'Giáo viên không được giao bài giảng cho môn học này trong năm học đã cho' });
    }
    
    // Create the grade
    const newGrade = await Grade.create(gradeData);
    return res.status(201).json(newGrade);
  } catch (error) {
    console.error('Error adding grade:', error);
    return res.status(500).json({ message: 'Không thể thêm điểm', error });
  }
};

// Update a grade
export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const gradeData = req.body;
    
    // Find the grade to update
    const grade = await Grade.findByPk(parseInt(id));
    if (!grade) {
      return res.status(404).json({ message: 'Điểm không tồn tại' });
    }
    
    // If teacher ID is changing, verify the new teacher is assigned to the subject
    if (gradeData.teacherId && gradeData.teacherId !== grade.teacherId) {
      const teacherAssignment = await TeacherSubjectAssignment.findOne({
        where: {
          teacherId: gradeData.teacherId,
          subjectId: grade.subjectId,
          academicYear: grade.academicYear
        }
      });
      
      if (!teacherAssignment) {
        return res.status(403).json({ message: 'Giáo viên mới không được giao bài giảng cho môn học này' });
      }
    }
    
    // Update the grade
    await grade.update(gradeData);
    return res.status(200).json(grade);
  } catch (error) {
    console.error('Error updating grade:', error);
    return res.status(500).json({ message: 'Không thể cập nhật điểm', error });
  }
};

// Delete a grade
export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const grade = await Grade.findByPk(parseInt(id));
    if (!grade) {
      return res.status(404).json({ message: 'Điểm không tồn tại' });
    }
    
    await grade.destroy();
    return res.status(200).json({ message: 'Điểm đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return res.status(500).json({ message: 'Không thể xóa điểm', error });
  }
};

// Get student grades by subject
export const getStudentGradesBySubject = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId } = req.params;
    const { academicYear, term } = req.query;
    
    const whereClause: any = {
      studentId: parseInt(studentId),
      subjectId: parseInt(subjectId)
    };
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    if (term) {
      whereClause.term = term;
    }
    
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student' },
        { model: Subject },
        { model: User, as: 'teacher' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching student grades by subject:', error);
    return res.status(500).json({ message: 'Không thể lấy điểm của sinh viên theo môn', error });
  }
};

// Get all grades for a student
export const getAllStudentGrades = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;
    
    const whereClause: any = {
      studentId: parseInt(studentId)
    };
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    if (term) {
      whereClause.term = term;
    }
    
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        { model: Subject },
        { model: User, as: 'teacher' }
      ],
      order: [['subjectId', 'ASC'], ['createdAt', 'DESC']]
    });
    
    return res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching all student grades:', error);
    return res.status(500).json({ message: 'Không thể lấy điểm của sinh viên', error });
  }
};

// Get all grades for a subject entered by a teacher
export const getTeacherSubjectGrades = async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId } = req.params;
    const { academicYear, term } = req.query;
    
    const whereClause: any = {
      teacherId: parseInt(teacherId),
      subjectId: parseInt(subjectId)
    };
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    if (term) {
      whereClause.term = term;
    }
    
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student' },
        { model: Subject }
      ],
      order: [['studentId', 'ASC'], ['createdAt', 'DESC']]
    });
    
    return res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching teacher subject grades:', error);
    return res.status(500).json({ message: 'Không thể lấy điểm của giáo viên theo môn', error });
  }
}; 