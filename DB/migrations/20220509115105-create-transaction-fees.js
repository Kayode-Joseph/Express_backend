'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('transaction_fees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },

      agent_type: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      transaction_percentage: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },
      cap: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },

      transfer_out_fee: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },

      max_debit_amount: {
        type: DataTypes.DOUBLE,

        allowNull: false,
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
    await queryInterface.dropTable('transaction_fees');
  },
};
