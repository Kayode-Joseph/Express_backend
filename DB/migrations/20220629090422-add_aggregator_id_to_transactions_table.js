'use strict';

module.exports = {
  async up (queryInterface, DataTypes) {
await queryInterface.addColumn('transactions', 'aggregator_id', {
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

await queryInterface.addColumn('transactions', 'aggregator_fee', {
  allowNull: true,
  defaultValue: null,
  type: DataTypes.DOUBLE,
});




  },

  async down (queryInterface, Sequelize) {
 await queryInterface.removeColumn('transactions', 'aggregator_id');

  await queryInterface.removeColumn('transactions', 'aggregator_fee');
  }
};
