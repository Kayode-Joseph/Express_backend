'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },

      storm_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      business_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mobile_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bvn: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM('merchant', 'agent_1', 'agent_2'),
        validate: { isIn: [['merchant', 'agent_1', 'agent_2']] },
        allowNull: true,
        defaultValue: 'agent_2',
      },

      terminal_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'terminal_ids',
          key: 'terminal_id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      is_transfer_enabled: {
        type: DataTypes.ENUM('true', 'false'),
        allowNull: false,
        defaultValue: 'false',
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
        default: 'user',
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
    await queryInterface.dropTable('users');
  },
};
