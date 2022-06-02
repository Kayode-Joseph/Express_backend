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
        type: DataTypes.STRING,
      },
      stan: {
        type: DataTypes.STRING,
      },
      tsi: {
        type: DataTypes.STRING,
      },
      tvr: {
        type: DataTypes.STRING,
      },
      account_type: {
        type: DataTypes.STRING,
      },

      acquiring_inst_code: {
        type: DataTypes.STRING,
      },
      additional_amount_54: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.DOUBLE,
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
      },

      card_label: {
        type: DataTypes.STRING,
      },

      local_date_13: {
        type: DataTypes.STRING,
      },
      local_date_12: {
        type: DataTypes.STRING,
      },
      masked_pan: {
        type: DataTypes.STRING,
      },
      merchant_id: {
        type: DataTypes.STRING,
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
      },
      response_de55: {
        type: DataTypes.TEXT,
      },
      terminal_id: {
        type: DataTypes.STRING,
      },
      transaction_time_in_mills: {
        type: DataTypes.BIGINT,
      },
      transaction_type: {
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
      },
      routing_channel: {
        type: DataTypes.STRING,
      },
      bank_code: DataTypes.STRING,
      reference: DataTypes.STRING,
      reference_from_etranzact: DataTypes.STRING,
      description: DataTypes.STRING,
      destination: DataTypes.STRING,
      sender_name: DataTypes.STRING,
      endPoint: DataTypes.STRING,

      transaction_fee: {
        type: DataTypes.DOUBLE,
        defaultValue: '0.00',
      },
      transaction_type: DataTypes.STRING,

      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      response_code: {
        type: DataTypes.STRING,
      },
      response_message: {
        type: DataTypes.STRING,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};