'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('storm_wallets', {
      // id: {
      //   allowNull: false,
      //   autoIncrement: true,
      //   primaryKey: false,
      //   type: DataTypes.INTEGER,
      // },
      terminal_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        validate: {
          len: 10,
        },
      },
      wallet_balance: { type: DataTypes.FLOAT, allowNull: false },

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
