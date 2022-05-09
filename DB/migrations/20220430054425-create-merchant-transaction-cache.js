'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('merchant_transaction_caches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      storm_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'storm_id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      rrn: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        validator: { notNull: true },
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      storm_id: {
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
    await queryInterface.dropTable('merchant_transaction_caches');
  },
};
