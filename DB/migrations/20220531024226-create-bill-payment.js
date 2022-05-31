'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('bill_payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      client_ref: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      storm_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.TEXT,
      },
      message: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      product_id: {
        type: DataTypes.STRING,
      },
      bill_id: {
        type: DataTypes.STRING,
      },

      customer_id: {
        type: DataTypes.STRING,
      },
      bill_name: {
        type: DataTypes.STRING,
      },
      bill_query_ref: {
        type: DataTypes.STRING,
      },
      transaction_fee: {
        type: DataTypes.DOUBLE,
      },
      user_type: {
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
    await queryInterface.dropTable('bill_payments');
  },
};
