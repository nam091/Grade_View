import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import Subject from './Subject';

interface StudentEnrollmentAttributes {
  id: number;
  studentId: number;
  subjectId: number;
  academicYear: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentEnrollmentInput extends Optional<StudentEnrollmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
export interface StudentEnrollmentOutput extends Required<StudentEnrollmentAttributes> {}

class StudentEnrollment extends Model<StudentEnrollmentAttributes, StudentEnrollmentInput> implements StudentEnrollmentAttributes {
  public id!: number;
  public studentId!: number;
  public subjectId!: number;
  public academicYear!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define static methods for associations
  public static associate(models: any) {
    StudentEnrollment.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
    StudentEnrollment.belongsTo(models.Subject, { foreignKey: 'subjectId' });
  }
}

StudentEnrollment.init(
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
        model: User,
        key: 'id',
      },
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Subject,
        key: 'id',
      },
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'student_enrollments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'subjectId', 'academicYear'],
      },
    ],
  }
);

// Set up associations
const setupAssociations = () => {
  StudentEnrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
  StudentEnrollment.belongsTo(Subject, { foreignKey: 'subjectId' });
};

// Call this after all models are initialized
export const initAssociations = () => {
  setupAssociations();
};

export default StudentEnrollment; 