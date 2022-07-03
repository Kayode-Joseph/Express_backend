'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('aggregator_wallets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      aggregator_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'aggregators',
          key: 'id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      wallet_balance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      ledger_balance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      pin: {
        type: DataTypes.STRING,
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
    await queryInterface.dropTable('aggregator_wallets');
  },
};
