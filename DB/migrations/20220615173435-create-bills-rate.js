'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('bills_rates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      bill_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bill_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      rate: {
        type: DataTypes.DOUBLE,
      },
      bill_category: {
        type: DataTypes.STRING,
      },
      cap: {
        type: DataTypes.DOUBLE,
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
    await queryInterface.dropTable('bills_rates');
  }
};