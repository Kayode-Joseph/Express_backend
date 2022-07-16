'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('aggregatorWalletTransactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },

      aggregator_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'aggregators',
          key: 'id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      reference: {
        type: DataTypes.STRING,
        allowNull:false
      },
      amount: {
        type: DataTypes.FLOAT,
        defaultValue: '0.00',
        validator: { notNull: true, isDecimal: true },
      },
      bank_code: DataTypes.STRING,

      reference_from_etranzact: DataTypes.STRING,
      description: DataTypes.STRING,
      destination: DataTypes.STRING,
      sender_name: DataTypes.STRING,
      endPoint: DataTypes.STRING,

      response_message: DataTypes.STRING,
      transaction_fee: {
        type: DataTypes.DOUBLE,
        defaultValue: '0.00',
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
    await queryInterface.dropTable('aggregatorWalletTransactions');
  }
};