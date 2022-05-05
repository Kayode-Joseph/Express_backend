'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('admins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      admin_id: {
        type: DataTypes.UUID,
        primaryKey: true,

        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          notNull: true,
        },
        unique: true,
      },
      password: { type: DataTypes.STRING, allowNull: false },
      business_name: { type: DataTypes.STRING, allowNull: false },
      mobile_number: { type: DataTypes.STRING, allowNull: false },
      account_number: { type: DataTypes.STRING, allowNull: false },
      bvn: { type: DataTypes.STRING, allowNull: false },
      super_user: {type: DataTypes.STRING, allowNull:false ,
      references: {
          model: 'superadmins',
          key: 'email',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        }
      
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
    await queryInterface.dropTable('admins');
  },
};
