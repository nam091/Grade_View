import { Request, Response } from 'express';
import { User } from '../models';
import { UserInput } from '../models/User';
import keycloakService from '../services/keycloakService';

// Create a new user (integrated with Keycloak)
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    console.log('Nhận dữ liệu người dùng:', { ...userData, password: '******' });
    
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      console.log(`User với email ${userData.email} đã tồn tại với ID: ${existingUser.id}`);
      return res.status(200).json(existingUser);
    }
    
    // Kiểm tra xem keycloakId đã tồn tại chưa
    if (userData.keycloakId) {
      const existingKeycloakUser = await User.findOne({ where: { keycloakId: userData.keycloakId } });
      if (existingKeycloakUser) {
        console.log(`User với keycloakId ${userData.keycloakId} đã tồn tại với ID: ${existingKeycloakUser.id}`);
        return res.status(200).json(existingKeycloakUser);
      }
    }
    
    // Tạo user trong Keycloak trước (nếu không đã có keycloakId)
    let keycloakId = userData.keycloakId || null;
    
    // Tạo user trong Keycloak trước
    try {
      // Lấy tên username từ email (phần trước @)
      const username = userData.email.split('@')[0];
      
      // Tách họ tên
      let firstName = userData.name;
      let lastName = '';
      
      if (userData.name && userData.name.includes(' ')) {
        const nameParts = userData.name.split(' ');
        lastName = nameParts.pop() || '';
        firstName = nameParts.join(' ');
      }
      
      keycloakId = await keycloakService.createUser({
        username,
        email: userData.email,
        firstName,
        lastName,
        password: userData.password,
        role: userData.role
      });
      
      console.log(`Tạo người dùng Keycloak với ID: ${keycloakId}`);
    } catch (keycloakError) {
      console.error('Không thể tạo người dùng Keycloak:', keycloakError);
      
      // GIẢi PHÁP TẠM THỜI: Nếu Keycloak không khả dụng, vẫn tạo user trong database
      // Điều này cho phép hệ thống vẫn hoạt động khi Keycloak đang gặp vấn đề
      console.warn('GIẢI PHÁP TẠM THỜI: Tạo người dùng không tích hợp Keycloak');
      console.warn('CẢNH BÁO: Người dùng sẽ không thể xác thực. Sửa kết nối Keycloak!');
      
      // Tạo một ID giả cho Keycloak (đánh dấu là tạm thời)
      keycloakId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Tạo user trong database với keycloakId
    const dbUserData: UserInput = {
      keycloakId,
      name: userData.name,
      email: userData.email,
      role: userData.role
    };
    
    console.log('Tạo người dùng trong cơ sở dữ liệu:', dbUserData);
    const newUser = await User.create(dbUserData);
    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Lỗi tạo người dùng:', error);
    return res.status(500).json({ 
      message: 'Không thể tạo người dùng', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định' 
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    return res.status(200).json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    return res.status(500).json({ message: 'Không thể lấy danh sách người dùng', error });
  }
};

// Get users by role (admin only)
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ được chỉ định' });
    }
    
    const users = await User.findAll({ where: { role } });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Lỗi lấy người dùng theo vai trò:', error);
    return res.status(500).json({ message: 'Không thể lấy danh sách người dùng', error });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi lấy người dùng:', error);
    return res.status(500).json({ message: 'Không thể lấy người dùng', error });
  }
};

// Get user by Keycloak ID
export const getUserByKeycloakId = async (req: Request, res: Response) => {
  try {
    const { keycloakId } = req.params;
    
    if (!keycloakId) {
      console.error('Không có keycloakId trong tham số yêu cầu');
      return res.status(400).json({ message: 'Bắt buộc phải cung cấp keycloakId' });
    }
    
    console.log(`Looking for user with keycloakId: ${keycloakId}`);
    
    const user = await User.findOne({ where: { keycloakId } });
    
    if (!user) {
      console.log(`Không tìm thấy người dùng với keycloakId: ${keycloakId}`);
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    
    console.log(`Tìm thấy người dùng trong cơ sở dữ liệu: ${user.id} (${user.name}, ${user.role})`);
    return res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi lấy người dùng theo keycloakId:', error);
    return res.status(500).json({ 
      message: 'Không thể lấy người dùng', 
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    const user = await User.findByPk(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    
    await user.update(userData);
    return res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi cập nhật người dùng:', error);
    return res.status(500).json({ message: 'Không thể cập nhật người dùng', error });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    
    // Lấy sequelize instance
    const sequelize = User.sequelize;
    if (!sequelize) {
      return res.status(500).json({ message: 'Lỗi kết nối cơ sở dữ liệu' });
    }
    
    // Xóa trong transaction để đảm bảo tính nhất quán
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Xóa dữ liệu liên quan trong grades
      await sequelize.query(
        `DELETE FROM grades WHERE "studentId" = :userId OR "teacherId" = :userId`,
        {
          replacements: { userId: id },
          transaction
        }
      );
      
      // 2. Xóa các liên kết môn học (nếu có)
      await sequelize.query(
        `DELETE FROM "teacher_subject_assignments" WHERE "teacherId" = :userId`,
        {
          replacements: { userId: id },
          transaction
        }
      );
      
      await sequelize.query(
        `DELETE FROM "student_enrollments" WHERE "studentId" = :userId`,
        {
          replacements: { userId: id },
          transaction
        }
      );
      
      // 3. Xóa người dùng từ database
      await user.destroy({ transaction });
      
      // 4. Nếu có keycloakId, xóa từ Keycloak
      if (user.keycloakId && !user.keycloakId.startsWith('temp_')) {
        try {
          await keycloakService.deleteUser(user.keycloakId);
          console.log(`Xóa người dùng khỏi Keycloak: ${user.keycloakId}`);
        } catch (keycloakError) {
          console.error('Lỗi xóa người dùng khỏi Keycloak:', keycloakError);
          console.warn('Người dùng đã được xóa khỏi cơ sở dữ liệu nhưng không từ Keycloak. Sửa kết nối Keycloak!');
          // Không rollback transaction nếu lỗi Keycloak, chỉ log lỗi
        }
      } else if (user.keycloakId && user.keycloakId.startsWith('temp_')) {
        console.log(`Bỏ qua xóa người dùng khỏi Keycloak cho ID tạm thời: ${user.keycloakId}`);
      }
      
      // Commit transaction
      await transaction.commit();
      return res.status(200).json({ 
        message: 'Người dùng và tất cả dữ liệu liên quan đã được xóa thành công',
        userId: id
      });
    } catch (error) {
      // Rollback nếu có lỗi
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Lỗi xóa người dùng:', error);
    return res.status(500).json({ message: 'Không thể xóa người dùng', error });
  }
};