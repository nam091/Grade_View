import User from './User';
import Subject from './Subject';
import Grade, { initAssociations as initGradeAssociations } from './Grade';
import TeacherSubjectAssignment, { initAssociations as initTeacherSubjectAssignmentAssociations } from './TeacherSubjectAssignment';
import StudentEnrollment, { initAssociations as initStudentEnrollmentAssociations } from './StudentEnrollment';
import RegistrationRequest from './RegistrationRequest';
import { sequelize } from '../config/database';

// Initialize all model associations
export const initializeAssociations = () => {
  // Initialize associations after all models are defined
  initGradeAssociations();
  initTeacherSubjectAssignmentAssociations();
  initStudentEnrollmentAssociations();
  
  // Additional associations
  User.hasMany(Grade, { foreignKey: 'studentId', as: 'studentGrades' });
  User.hasMany(Grade, { foreignKey: 'teacherId', as: 'teacherGrades' });
  Subject.hasMany(Grade, { foreignKey: 'subjectId' });

  User.hasMany(TeacherSubjectAssignment, { foreignKey: 'teacherId', as: 'subjectAssignments' });
  Subject.hasMany(TeacherSubjectAssignment, { foreignKey: 'subjectId', as: 'teacherAssignments' });

  User.hasMany(StudentEnrollment, { foreignKey: 'studentId', as: 'enrollments' });
  Subject.hasMany(StudentEnrollment, { foreignKey: 'subjectId', as: 'enrolledStudents' });

  // RegistrationRequest associations
  User.hasMany(RegistrationRequest, { foreignKey: 'studentId', as: 'registrationRequests' });
  User.hasMany(RegistrationRequest, { foreignKey: 'approvedBy', as: 'approvedRequests' });
  Subject.hasMany(RegistrationRequest, { foreignKey: 'subjectId', as: 'registrationRequests' });
  
  RegistrationRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
  RegistrationRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
  RegistrationRequest.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
};

// Function to sync all models with the database
export const syncModels = async () => {
  try {
    // Initialize associations before syncing
    initializeAssociations();
    
    await sequelize.sync({ alter: true });
    console.log('Tất cả các mô hình đã được đồng bộ hóa thành công.');
  } catch (error) {
    console.error('Lỗi đồng bộ hóa mô hình:', error);
    throw error;
  }
};

export {
  User,
  Subject,
  Grade,
  TeacherSubjectAssignment,
  StudentEnrollment,
  RegistrationRequest,
  sequelize
}; 