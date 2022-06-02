'use strict';

module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.addColumn('storm_wallets', 'pin', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:
        '$2b$10$DlqFywZrESC0nU9auMSBiebLfk.CKNGwQEWnLbrZiYip7uX0Pyqvu',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('storm_wallets', 'pin');
  },
};

