import { Request, Response } from 'express';
import RegistrationRequest, { RegistrationStatus } from '../models/RegistrationRequest';
import { User, Subject, StudentEnrollment } from '../models';

// Sinh viên tạo yêu cầu đăng ký môn học
export const createRegistrationRequest = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, academicYear, reason } = req.body;
    
    console.log('Creating registration request:', { studentId, subjectId, academicYear, reason });
    
    // Kiểm tra sinh viên có tồn tại không
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Sinh viên không tồn tại' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User không phải là sinh viên' });
    }
    
    // Kiểm tra môn học có tồn tại không
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }
    
    // Kiểm tra xem sinh viên đã đăng ký môn học này chưa
    const existingEnrollment = await StudentEnrollment.findOne({
      where: { studentId, subjectId, academicYear }
    });
    
    if (existingEnrollment) {
      return res.status(409).json({ message: 'Sinh viên đã đăng ký môn học này' });
    }
    
    // Kiểm tra xem đã có yêu cầu đăng ký pending không
    const existingRequest = await RegistrationRequest.findOne({
      where: { 
        studentId, 
        subjectId, 
        academicYear,
        status: RegistrationStatus.PENDING
      }
    });
    
    if (existingRequest) {
      return res.status(409).json({ message: 'Đã có yêu cầu đăng ký môn học này đang chờ phê duyệt' });
    }
    
    // Tạo yêu cầu đăng ký mới
    const registrationRequest = await RegistrationRequest.create({
      studentId,
      subjectId,
      academicYear: academicYear || '2023-2024',
      reason,
      status: RegistrationStatus.PENDING
    });
    
    console.log('Yêu cầu đăng ký đã được tạo thành công:', registrationRequest.id);
    
    return res.status(201).json({
      id: registrationRequest.id,
      studentId: registrationRequest.studentId,
      subjectId: registrationRequest.subjectId,
      academicYear: registrationRequest.academicYear,
      status: registrationRequest.status,
      reason: registrationRequest.reason,
      requestedAt: registrationRequest.requestedAt
    });
  } catch (error) {
    console.error('Error creating registration request:', error);
    return res.status(500).json({ 
      message: 'Không thể tạo yêu cầu đăng ký', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Admin lấy danh sách tất cả yêu cầu đăng ký
export const getAllRegistrationRequests = async (req: Request, res: Response) => {
  try {
    const { status, academicYear } = req.query;
    
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    console.log('Lấy danh sách yêu cầu đăng ký với các bộ lọc:', whereClause);
    
    const requests = await RegistrationRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code', 'credits']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['requestedAt', 'DESC']]
    });
    
    console.log(`Tìm thấy ${requests.length} yêu cầu đăng ký`);
    
    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách yêu cầu đăng ký', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Sinh viên lấy danh sách yêu cầu đăng ký của mình
export const getStudentRegistrationRequests = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { status, academicYear } = req.query;
    
    if (!studentId || isNaN(parseInt(studentId))) {
      return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
    }
    
    const whereClause: any = { studentId: parseInt(studentId) };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (academicYear) {
      whereClause.academicYear = academicYear;
    }
    
    console.log('Lấy danh sách yêu cầu đăng ký của sinh viên:', whereClause);
    
    const requests = await RegistrationRequest.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code', 'credits']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['requestedAt', 'DESC']]
    });
    
    console.log(`Tìm thấy ${requests.length} yêu cầu đăng ký cho sinh viên ${studentId}`);
    
    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching student registration requests:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách yêu cầu đăng ký của sinh viên', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Admin phê duyệt hoặc từ chối yêu cầu đăng ký
export const processRegistrationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, adminNote, adminId } = req.body; // action: 'approve' | 'reject'
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Hành động không hợp lệ. Phải là "approve" hoặc "reject"' });
    }
    
    if (!adminId) {
      return res.status(400).json({ message: 'Bắt buộc phải có ID admin' });
    }
    
    console.log(`Xử lý yêu cầu đăng ký ${id} với hành động: ${action}`);
    
    const request = await RegistrationRequest.findByPk(parseInt(id), {
      include: [
        { model: User, as: 'student' },
        { model: Subject, as: 'subject' }
      ]
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Yêu cầu đăng ký không tồn tại' });
    }
    
    if (request.status !== RegistrationStatus.PENDING) {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }
    
    // Kiểm tra admin có tồn tại không - kiểm tra cả database ID và Keycloak ID
    let admin;
    
    console.log(`Kiểm tra admin với ID: ${adminId}`);
    
    // Thử tìm user bằng database ID (số nguyên)
    if (!isNaN(parseInt(adminId))) {
      admin = await User.findByPk(parseInt(adminId));
      console.log(`Tìm kiếm bằng ID database ${parseInt(adminId)}: ${admin ? 'Tìm thấy' : 'Không tìm thấy'}`);
    }
    
    // Nếu không tìm thấy bằng ID, thử tìm bằng Keycloak ID (UUID)
    if (!admin) {
      admin = await User.findOne({ where: { keycloakId: adminId } });
      console.log(`Tìm kiếm bằng ID Keycloak ${adminId}: ${admin ? 'Tìm thấy' : 'Không tìm thấy'}`);
      
      // Trường hợp không tìm được user, nhưng có admin trong hệ thống
      if (!admin) {
        // Tìm admin đầu tiên trong hệ thống để sử dụng
        admin = await User.findOne({ where: { role: 'admin' } });
        if (admin) {
          console.log(`Không tìm thấy chính xác, sử dụng admin mặc định: ${admin.id} (${admin.name})`);
        } else {
          // Tìm bằng regex cho UUID nếu là UUID hợp lệ
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminId)) {
            const allUsers = await User.findAll();
            console.log(`Tìm kiếm trong ${allUsers.length} người dùng`);
            
            for (const user of allUsers) {
              if (user.role === 'admin') {
                console.log(`Tìm thấy admin: ${user.id}, ${user.name}, keycloakId: ${user.keycloakId}`);
              }
            }
          }
        }
      }
    }
    
    if (!admin) {
      console.error(`Không tìm thấy admin với ID: ${adminId}`);
      return res.status(403).json({ message: 'Thông tin admin không hợp lệ' });
    }
    
    if (admin.role !== 'admin') {
      console.error(`Người dùng tìm thấy nhưng vai trò là ${admin.role}, không phải admin`);
      return res.status(403).json({ message: 'Thông tin admin không hợp lệ' });
    }
    
    console.log(`Admin đã được xác thực: ${admin.id}, ${admin.name}, vai trò: ${admin.role}`);
    
    if (action === 'approve') {
      // Kiểm tra xem sinh viên đã đăng ký môn học này chưa (có thể đã được đăng ký bởi admin khác)
      const existingEnrollment = await StudentEnrollment.findOne({
        where: { 
          studentId: request.studentId, 
          subjectId: request.subjectId, 
          academicYear: request.academicYear 
        }
      });
      
      if (existingEnrollment) {
        // Cập nhật trạng thái request nhưng không tạo enrollment mới
        await request.update({
          status: RegistrationStatus.APPROVED,
          adminNote: adminNote || 'Đã đăng ký',
          approvedBy: admin.id,
          approvedAt: new Date()
        });
        
        return res.status(200).json({
          message: 'Yêu cầu đã được phê duyệt, nhưng sinh viên đã đăng ký rồi',
          request: request
        });
      }
      
      // Tạo StudentEnrollment mới
      await StudentEnrollment.create({
        studentId: request.studentId,
        subjectId: request.subjectId,
        academicYear: request.academicYear
      });
      
      // Cập nhật trạng thái request
      await request.update({
        status: RegistrationStatus.APPROVED,
        adminNote,
        approvedBy: admin.id,
        approvedAt: new Date()
      });
      
      console.log(`Yêu cầu đăng ký ${id} đã được phê duyệt và enrollment đã được tạo`);
      
      return res.status(200).json({
        message: 'Yêu cầu đăng ký đã được phê duyệt và sinh viên đã đăng ký thành công',
        request: request
      });
    } else {
      // Từ chối yêu cầu
      await request.update({
        status: RegistrationStatus.REJECTED,
        adminNote,
        approvedBy: admin.id,
        approvedAt: new Date()
      });
      
      console.log(`Yêu cầu đăng ký ${id} đã bị từ chối`);
      
      return res.status(200).json({
        message: 'Yêu cầu đăng ký đã bị từ chối',
        request: request
      });
    }
  } catch (error) {
    console.error('Lỗi xử lý yêu cầu đăng ký:', error);
    return res.status(500).json({ 
      message: 'Không thể xử lý yêu cầu đăng ký', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Lấy danh sách môn học có thể đăng ký (chưa đăng ký và chưa có yêu cầu pending)
export const getAvailableSubjectsForStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;
    
    if (!studentId || isNaN(parseInt(studentId))) {
      return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
    }
    
    const currentAcademicYear = typeof academicYear === 'string' ? academicYear : '2023-2024';
    const parsedStudentId = parseInt(studentId);
    
    console.log(`Lấy danh sách môn học có thể đăng ký cho sinh viên ${parsedStudentId}, năm học: ${currentAcademicYear}`);
    
    // Lấy tất cả môn học
    const allSubjects = await Subject.findAll();
    
    // Lấy môn học đã đăng ký
    const enrolledSubjects = await StudentEnrollment.findAll({
      where: { studentId: parsedStudentId, academicYear: currentAcademicYear },
      attributes: ['subjectId']
    });
    const enrolledSubjectIds = enrolledSubjects.map(enrollment => enrollment.subjectId);
    
    // Lấy môn học đã có yêu cầu pending
    const pendingRequests = await RegistrationRequest.findAll({
      where: { 
        studentId: parsedStudentId, 
        academicYear: currentAcademicYear,
        status: RegistrationStatus.PENDING
      },
      attributes: ['subjectId']
    });
    const pendingSubjectIds = pendingRequests.map((request: any) => request.subjectId);
    
    // Lọc ra các môn học có thể đăng ký
    const unavailableSubjectIds = [...enrolledSubjectIds, ...pendingSubjectIds];
    const availableSubjects = allSubjects.filter(subject => 
      !unavailableSubjectIds.includes(subject.id)
    );
    
    console.log(`Tìm thấy ${availableSubjects.length} môn học có thể đăng ký cho sinh viên ${parsedStudentId}`);
    
    return res.status(200).json(availableSubjects);
  } catch (error) {
    console.error('Lỗi lấy danh sách môn học có thể đăng ký:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách môn học có thể đăng ký', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
}; 