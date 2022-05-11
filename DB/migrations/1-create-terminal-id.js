'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('terminal_ids', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      terminal_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      merchant_id: {
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('terminal_ids');
  },
};
