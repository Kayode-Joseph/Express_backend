'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('debit_wallet_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },

      bank_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      destination: {
        type: DataTypes.STRING,
      },
      sender_name: {
        type: DataTypes.TEXT,
      },
      endPoint: {
        type: DataTypes.TEXT,
      },
      terminal_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      storm_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('approved', 'declined'),
        allowNull: false,
        validate: { isIn: [['approved', 'declined']] },
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
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
    await queryInterface.dropTable('debit_wallet_transactions');
  },
};
