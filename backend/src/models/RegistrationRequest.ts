import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

interface RegistrationRequestAttributes {
  id: number;
  studentId: number;
  subjectId: number;
  academicYear: string;
  status: RegistrationStatus;
  reason?: string; // Lý do đăng ký từ sinh viên
  adminNote?: string; // Ghi chú từ admin khi phê duyệt/từ chối
  approvedBy?: number; // ID của admin phê duyệt
  requestedAt: Date;
  approvedAt?: Date;
}

interface RegistrationRequestCreationAttributes extends Optional<RegistrationRequestAttributes, 'id' | 'requestedAt' | 'approvedAt'> {}

class RegistrationRequest extends Model<RegistrationRequestAttributes, RegistrationRequestCreationAttributes> 
  implements RegistrationRequestAttributes {
  
  public id!: number;
  public studentId!: number;
  public subjectId!: number;
  public academicYear!: string;
  public status!: RegistrationStatus;
  public reason?: string;
  public adminNote?: string;
  public approvedBy?: number;
  public requestedAt!: Date;
  public approvedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RegistrationRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '2023-2024',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RegistrationStatus)),
      allowNull: false,
      defaultValue: RegistrationStatus.PENDING,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'registration_requests',
    timestamps: true,
  }
);

export default RegistrationRequest; 