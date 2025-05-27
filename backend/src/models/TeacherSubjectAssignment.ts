import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import Subject from './Subject';

interface TeacherSubjectAssignmentAttributes {
  id: number;
  teacherId: number;
  subjectId: number;
  academicYear: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeacherSubjectAssignmentInput extends Optional<TeacherSubjectAssignmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
export interface TeacherSubjectAssignmentOutput extends Required<TeacherSubjectAssignmentAttributes> {}

class TeacherSubjectAssignment extends Model<TeacherSubjectAssignmentAttributes, TeacherSubjectAssignmentInput> implements TeacherSubjectAssignmentAttributes {
  public id!: number;
  public teacherId!: number;
  public subjectId!: number;
  public academicYear!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define static methods for associations
  public static associate(models: any) {
    TeacherSubjectAssignment.belongsTo(models.User, { foreignKey: 'teacherId', as: 'teacher' });
    TeacherSubjectAssignment.belongsTo(models.Subject, { foreignKey: 'subjectId' });
  }
}

TeacherSubjectAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
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
    tableName: 'teacher_subject_assignments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['teacherId', 'subjectId', 'academicYear'],
      },
    ],
  }
);

// Set up associations
const setupAssociations = () => {
  TeacherSubjectAssignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
  TeacherSubjectAssignment.belongsTo(Subject, { foreignKey: 'subjectId' });
};

// Call this after all models are initialized
export const initAssociations = () => {
  setupAssociations();
};

export default TeacherSubjectAssignment; 