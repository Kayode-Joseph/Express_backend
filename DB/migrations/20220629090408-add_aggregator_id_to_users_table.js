'use strict';

module.exports = {
  async up (queryInterface, DataTypes) {
  await queryInterface.addColumn('users', 'aggregator_id', {
    type: DataTypes.UUID,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'aggregators',
      key: 'id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  },

  async down (queryInterface, Sequelize) {
 await queryInterface.removeColumn('users', 'aggregator_id');

  }
};
