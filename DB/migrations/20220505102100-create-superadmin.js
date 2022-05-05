'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('superadmins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      email: { type: DataTypes.STRING, primaryKey: true },
      password: {
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
    await queryInterface.dropTable('superadmins');
  },
};
