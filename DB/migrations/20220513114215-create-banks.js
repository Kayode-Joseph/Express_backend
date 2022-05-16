'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('banks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      bank_code: {
        allowNull: false,
        type: DataTypes.STRING,
        primaryKey: true,
      },
      bank_name: {
        allowNull: false,
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
    await queryInterface.dropTable('banks');
  }
};