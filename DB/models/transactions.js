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
    static associate({user}) {
      // define association here
      this.belongsTo(user, {foreignKey: 'storm_id'})
    }
  }
  transactions.init(
    {
      aid: {
        type: DataTypes.STRING,
      },
      storm_id: {
        type: DataTypes.STRING,
        allowNull: false,
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
        validator: { notNull: true, isDecimal: true },
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
      id: {
        type: DataTypes.INTEGER,
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
        allowNull: false,
      },
      other_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      other_id: {
        type: DataTypes.STRING,
      },
      response_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      response_de55: {
        type: DataTypes.STRING,
      },
      terminal_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      transaction_time_in_mills: {
        type: DataTypes.INTEGER,
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
        allowNull: false,
        type: DataTypes.STRING,
      },
    },

    {
      sequelize,
      modelName: 'transactions',
    }
  );
  return transactions;
};
