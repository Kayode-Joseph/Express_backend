'use strict';
const { type } = require('express/lib/response');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transactions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user }) {
      // define association here
      this.belongsTo(user, { foreignKey: 'storm_id' });
    }
  }
  transactions.init(
    {
      id: {
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      aid: {
        type: DataTypes.STRING,
      },
      storm_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rrn: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tsi: {
        type: DataTypes.STRING,
      },
      tvr: {
        type: DataTypes.STRING,
      },
      account_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      acquiring_inst_code: {
        type: DataTypes.STRING,
      },
      additional_amount_54: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.FLOAT,
        defaultValue: '0.00',
        validator: { notNull: true, isDecimal: true },
      },
      app_cryptogram: {
        type: DataTypes.STRING,
      },
      bank_code: DataTypes.STRING,
      reference: DataTypes.STRING,
      reference_from_etranzact: DataTypes.STRING,
      description: DataTypes.STRING,
      destination: DataTypes.STRING,
      sender_name: DataTypes.STRING,
      endPoint: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('approved', 'declined'),
        allowNull: true,
      },
      response_message: DataTypes.STRING,
      transaction_fee: {
        type: DataTypes.DOUBLE,
        defaultValue: '0.00',
      },
      auth_code: {
        type: DataTypes.STRING,
      },
      card_expiry: {
        type: DataTypes.STRING,
      },

      card_holder: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      card_label: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      local_date_13: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      local_date_12: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      masked_pan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchant_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      original_forwarding_inst_code: {
        type: DataTypes.STRING,
      },
      original_forwarding_inst_code: {
        type: DataTypes.STRING,
      },
      transaction_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      other_amount: {
        type: DataTypes.FLOAT,
        defaultValue: '0.00',
      },
      other_id: {
        type: DataTypes.STRING,
      },
      response_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      response_de55: {
        type: DataTypes.TEXT,
      },
      terminal_id: {
        type: DataTypes.STRING,
        allowNull: true,
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
        validator: { notNull: true },
      },
      transaction_status: {
        allowNull: true,
        type: DataTypes.ENUM('approved', 'declined'),
      },
      settlement_status: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      routing_channel: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      transaction_type: DataTypes.STRING,
      response_code: {
        type: DataTypes.STRING,
      },
      response_message: {
        type: DataTypes.STRING,
      },
      bill_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bill_name:{
      type: DataTypes.STRING,
      allowNull: true,
    }
    },

    {
      sequelize,
      modelName: 'transactions',
    }
  );
  return transactions;
};
