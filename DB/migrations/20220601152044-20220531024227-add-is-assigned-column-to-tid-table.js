'use strict';

module.exports = {
  async up (queryInterface, DataTypes) {
  
      await queryInterface.addColumn('terminal_ids', 'is_assigned', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      });
     
  },

  async down (queryInterface, Sequelize) {

      await queryInterface.removeColumn('terminal_ids','is_assigned');
    
  }
};
