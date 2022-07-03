'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('aggregators', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,

        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: {
          isEmail: true,
          notNull: true,
        },
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: {
          length:[3,99],
          notNull: true,
        },
      },
      phoneNumber:DataTypes.STRING,
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
    await queryInterface.dropTable('aggregators');
  }
};