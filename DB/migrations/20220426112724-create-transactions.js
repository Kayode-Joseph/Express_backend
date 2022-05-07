'use strict';
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },
      storm_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'storm_id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      aid: {
        type: DataTypes.STRING,
      },
      rrn: {
        primaryKey: true,
        type: DataTypes.STRING,
        allowNull: false,
      },
      stan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tsi: {
        type: DataTypes.STRING,
      },
      tvr: {
        type: DataTypes.STRING,
      },
      account_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      acquiring_inst_code: {
        type: DataTypes.STRING,
      },
      additional_amount_54: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      app_cryptogram: {
        type: DataTypes.STRING,
      },
      auth_code: {
        type: DataTypes.STRING,
      },
      card_expiry: {
        type: DataTypes.STRING,
      },

      card_holder: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      card_label: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      local_date_13: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      local_date_12: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      masked_pan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      merchant_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      original_forwarding_inst_code: {
        type: DataTypes.STRING,
      },
      transaction_type: {
        type: DataTypes.STRING,
      },
      other_amount: {
        type: DataTypes.INTEGER,
      },
      other_id: {
        type: DataTypes.STRING,
      },
      response_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      response_de55: {
        type: DataTypes.TEXT,
      },
      terminal_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      transaction_time_in_mills: {
        type: DataTypes.BIGINT,
      },
      transaction_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      transmission_date_time: {
        type: DataTypes.STRING,
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      transaction_status: {
        allowNull: false,
        type: DataTypes.ENUM('approved', 'declined'),
      },
      settlement_status: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      routing_channel: {
        allowNull: false,
        type: DataTypes.STRING,
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
    await queryInterface.dropTable('transactions');
  }
};