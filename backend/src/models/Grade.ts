import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import Subject from './Subject';

interface GradeAttributes {
  id: number;
  studentId: number;
  subjectId: number;
  teacherId: number;
  score: number;
  term: string;
  academicYear: string;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GradeInput extends Optional<GradeAttributes, 'id' | 'comment' | 'createdAt' | 'updatedAt'> {}
export interface GradeOutput extends Required<GradeAttributes> {}

class Grade extends Model<GradeAttributes, GradeInput> implements GradeAttributes {
  public id!: number;
  public studentId!: number;
  public subjectId!: number;
  public teacherId!: number;
  public score!: number;
  public term!: string;
  public academicYear!: string;
  public comment!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define static methods for associations
  public static associate(models: any) {
    Grade.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
    Grade.belongsTo(models.User, { foreignKey: 'teacherId', as: 'teacher' });
    Grade.belongsTo(models.Subject, { foreignKey: 'subjectId' });
  }
}

Grade.init(
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
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'grades',
    timestamps: true,
  }
);

// Set up associations
const setupAssociations = () => {
  Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
  Grade.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
  Grade.belongsTo(Subject, { foreignKey: 'subjectId' });
};

// Call this after all models are initialized
export const initAssociations = () => {
  setupAssociations();
};

export default Grade; 