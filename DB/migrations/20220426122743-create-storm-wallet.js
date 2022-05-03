'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('storm_wallets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      storm_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'storm_id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },

      wallet_balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      ledger_balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
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
    await queryInterface.dropTable('storm_wallets');
  },
};
