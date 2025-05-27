import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SubjectAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubjectInput extends Optional<SubjectAttributes, 'id' | 'description' | 'credits' | 'createdAt' | 'updatedAt'> {}
export interface SubjectOutput extends Required<SubjectAttributes> {}

class Subject extends Model<SubjectAttributes, SubjectInput> implements SubjectAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public credits!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define static methods for associations
  public static associate(models: any) {
    // Define associations here if needed
  }
}

Subject.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'subjects',
    timestamps: true,
  }
);

export default Subject; 