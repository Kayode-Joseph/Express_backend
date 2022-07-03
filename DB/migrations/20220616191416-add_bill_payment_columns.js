'use strict';

module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.addColumn('transactions', 'bill_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('transactions', 'product_id', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('transactions', 'bill_name', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transactions', 'bill_id');
    await queryInterface.removeColumn('transactions', 'product_id');
    await queryInterface.removeColumn('transactions', 'bill_name');
  },
};
