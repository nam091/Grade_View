import { Request, Response } from 'express';
import { Subject, TeacherSubjectAssignment, StudentEnrollment, User } from '../models';
import { SubjectInput } from '../models/Subject';

// Create a new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    const subjectData: SubjectInput = req.body;
    
    const existingSubject = await Subject.findOne({ where: { code: subjectData.code } });
    if (existingSubject) {
      return res.status(409).json({ message: 'Môn học với mã này đã tồn tại' });
    }
    
    const newSubject = await Subject.create(subjectData);
    return res.status(201).json(newSubject);
  } catch (error) {
    console.error('Lỗi tạo môn học:', error);
    return res.status(500).json({ message: 'Không thể tạo môn học', error });
  }
};

// Get all subjects
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.findAll({
      include: [
        {
          model: TeacherSubjectAssignment,
          as: 'teacherAssignments',
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });
    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Lỗi lấy danh sách môn học:', error);
    return res.status(500).json({ message: 'Không thể lấy danh sách môn học', error });
  }
};

// Get subject by ID
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(parseInt(id));
    
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    return res.status(200).json(subject);
  } catch (error) {
    console.error('Lỗi lấy môn học:', error);
    return res.status(500).json({ message: 'Không thể lấy môn học', error });
  }
};

// Update subject
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectData = req.body;
    
    const subject = await Subject.findByPk(parseInt(id));
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    await subject.update(subjectData);
    return res.status(200).json(subject);
  } catch (error) {
    console.error('Lỗi cập nhật môn học:', error);
    return res.status(500).json({ message: 'Không thể cập nhật môn học', error });
  }
};

// Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByPk(parseInt(id));
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    await subject.destroy();
    return res.status(200).json({ message: 'Môn học đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa môn học:', error);
    return res.status(500).json({ message: 'Không thể xóa môn học', error });
  }
};

// Assign teacher to subject
export const assignTeacherToSubject = async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId, academicYear } = req.body;
    
    // If teacherId is null or empty, it means we are removing the teacher assignment
    if (!teacherId) {
      // Find any existing assignments for this subject
      const existingAssignment = await TeacherSubjectAssignment.findOne({
        where: { subjectId, academicYear }
      });
      
      // If found, delete it
      if (existingAssignment) {
        await existingAssignment.destroy();
        return res.status(200).json({ message: 'Phân công giáo viên đã được xóa thành công' });
      }
      
      // If not found, nothing to do
      return res.status(200).json({ message: 'Không có giáo viên được phân công cho môn học này' });
    }
    
    // Otherwise, we are assigning or updating a teacher
    const teacher = await User.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Giáo viên không tồn tại' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Người dùng không phải là giáo viên' });
    }
    
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    // Find any existing assignment for this subject in the given academic year
    const existingAssignment = await TeacherSubjectAssignment.findOne({
      where: { subjectId, academicYear }
    });
    
    // If there's an existing assignment but with a different teacher, update it
    if (existingAssignment) {
      await existingAssignment.update({ teacherId });
      return res.status(200).json(existingAssignment);
    }
    
    // If no existing assignment, create a new one
    const newAssignment = await TeacherSubjectAssignment.create({
      teacherId, subjectId, academicYear
    });
    
    return res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Lỗi phân công giáo viên cho môn học:', error);
    return res.status(500).json({ message: 'Không thể phân công giáo viên cho môn học', error });
  }
};

// Get subjects taught by a teacher
export const getTeacherSubjects = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { academicYear } = req.query;
    
    console.log(`Lấy danh sách môn học cho giáo viên ${teacherId}, năm học: ${academicYear || 'tất cả'}`);
    
    if (!teacherId) {
      console.error('Teacher ID không tồn tại trong request params');
      return res.status(400).json({ message: 'Bắt buộc phải cung cấp ID giáo viên' });
    }
    
    if (isNaN(parseInt(teacherId))) {
      console.error(`Định dạng ID giáo viên không hợp lệ: ${teacherId}`);
      return res.status(400).json({ message: 'Định dạng ID giáo viên không hợp lệ' });
    }
    
    const parsedTeacherId = parseInt(teacherId);
    
    // Kiểm tra xem ID giáo viên có tồn tại không
    const teacherExists = await User.findByPk(parsedTeacherId);
    if (!teacherExists) {
      console.error(`Giáo viên với ID ${parsedTeacherId} không tồn tại trong cơ sở dữ liệu`);
      return res.status(404).json({ message: 'Giáo viên không tồn tại' });
    }
    
    // Kiểm tra vai trò
    if (teacherExists.role !== 'teacher') {
      console.warn(`User ${parsedTeacherId} tồn tại nhưng có vai trò '${teacherExists.role}' thay vì 'teacher'`);
      return res.status(400).json({ message: 'Người dùng không phải là giáo viên' });
    }
    
    const whereClause: any = { teacherId: parsedTeacherId };
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    console.log(`Tìm kiếm phân công với query:`, whereClause);
    
    const assignments = await TeacherSubjectAssignment.findAll({
      where: whereClause,
      include: [
        { model: Subject },
        { 
          model: User, 
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
    
    console.log(`Tìm thấy ${assignments.length} phân công môn học cho giáo viên ${parsedTeacherId}`);
    
    if (assignments.length === 0) {
      // Trả về mảng rỗng nếu không có phân công
      return res.status(200).json([]);
    }
    
    // Trả về danh sách các môn học thay vì danh sách phân công
    const subjects = assignments.map(assignment => {
      // Sử dụng type assertion để truy cập thuộc tính Subject từ các relationship
      const subject = (assignment as any).Subject.toJSON();
      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        credits: subject.credits,
        academicYear: assignment.academicYear
      };
    });
    
    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Lỗi lấy danh sách môn học của giáo viên:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách môn học của giáo viên', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Enroll student in a subject
export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, academicYear } = req.body;
    
    console.log('Nhận yêu cầu đăng ký sinh viên:', { studentId, subjectId, academicYear });
    
    // Validate input
    if (!studentId || !subjectId || !academicYear) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc', 
        required: ['studentId', 'subjectId', 'academicYear'] 
      });
    }
    
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Học sinh không tồn tại' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Người dùng không phải là học sinh' });
    }
    
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await StudentEnrollment.findOne({
      where: { studentId, subjectId, academicYear }
    });
    
    if (existingEnrollment) {
      console.log(`Sinh viên ${studentId} đã đăng ký môn học ${subjectId} trong năm học ${academicYear}`);
      return res.status(409).json({ 
        message: 'Học sinh đã đăng ký môn học này trong năm học đã chọn',
        enrollment: existingEnrollment
      });
    }
    
    // Create new enrollment
    const enrollment = await StudentEnrollment.create({
      studentId,
      subjectId,
      academicYear
    });
    
    console.log(`Đã tạo đăng ký mới cho sinh viên ${studentId} trong môn học ${subjectId}`);
    
    return res.status(201).json({
      message: 'Đăng ký thành công',
      enrollment
    });
  } catch (error) {
    console.error('Lỗi đăng ký học sinh:', error);
    return res.status(500).json({ 
      message: 'Không thể đăng ký học sinh', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Get subjects a student is enrolled in
export const getStudentSubjects = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;
    
    if (!studentId || isNaN(parseInt(studentId))) {
      return res.status(400).json({ message: 'Định dạng ID học sinh không hợp lệ' });
    }
    
    const parsedStudentId = parseInt(studentId);
    
    const whereClause: any = { studentId: parsedStudentId };
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    console.log(`Tìm kiếm đăng ký với query:`, whereClause);
    
    const enrollments = await StudentEnrollment.findAll({
      where: whereClause,
      include: [
        { model: Subject },
        { model: User, as: 'student' }
      ]
    });
    
    console.log(`Tìm thấy ${enrollments.length} đăng ký cho học sinh ${parsedStudentId}`);
    
    return res.status(200).json(enrollments);
  } catch (error) {
    console.error('Lỗi lấy danh sách môn học của học sinh:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách môn học của học sinh', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Get students enrolled in a specific subject
export const getEnrolledStudents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;
    
    console.log(`getEnrolledStudents được gọi với ID môn học: ${id}, năm học: ${academicYear || 'tất cả'}`);
    
    if (!id) {
      console.error('ID môn học không tồn tại trong request params');
      return res.status(400).json({ message: 'ID môn học là bắt buộc' });
    }
    
    // Support both string and number IDs
    let parsedSubjectId: number;
    if (isNaN(parseInt(id))) {
      console.error(`Định dạng ID môn học không hợp lệ: ${id}`);
      return res.status(400).json({ message: 'Định dạng ID môn học không hợp lệ' });
    } else {
      parsedSubjectId = parseInt(id);
    }
    
    // Kiểm tra xem môn học có tồn tại không
    const subject = await Subject.findByPk(parsedSubjectId);
    if (!subject) {
      console.error(`Môn học với ID ${parsedSubjectId} không tồn tại trong cơ sở dữ liệu`);
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    console.log(`Tìm thấy môn học: ${subject.name} (ID: ${subject.id})`);
    
    const whereClause: any = { subjectId: parsedSubjectId };
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    console.log(`Tìm kiếm đăng ký trong môn học ${parsedSubjectId}:`, whereClause);
    
    const enrollments = await StudentEnrollment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });
    
    console.log(`Tìm thấy ${enrollments.length} đăng ký cho môn học ${parsedSubjectId}`);
    
    // Chỉ trả về thông tin học sinh, không phải thông tin đăng ký
    const enrolledStudents = enrollments.map(enrollment => {
      const student = (enrollment as any).student;
      if (!student) {
        console.warn(`Không tìm thấy dữ liệu học sinh cho đăng ký ID ${(enrollment as any).id}`);
        return null;
      }
      return student;
    }).filter(student => student !== null);
    
    console.log(`Trả về ${enrolledStudents.length} bản ghi học sinh`);
    
    return res.status(200).json(enrolledStudents);
  } catch (error) {
    console.error('Lỗi lấy danh sách học sinh đã đăng ký:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách học sinh đã đăng ký', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
}; 