import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('subjects', 'credits', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('subjects', 'credits');
  }
}; 