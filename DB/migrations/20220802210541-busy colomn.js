'use strict';

module.exports = {
  async up (queryInterface, DataTypes) {


    await queryInterface.addColumn('storm_wallets', 'isBusy', {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
    });


    await queryInterface.addColumn('aggregator_wallets', 'isBusy', {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
    });

  },

  async down (queryInterface, Sequelize) {
  await queryInterface.removeColumn('storm_wallets', 'isBusy');

   await queryInterface.removeColumn('aggregator_wallets', 'isBusy');
  }
};
