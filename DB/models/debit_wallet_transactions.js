'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class debit_wallet_transactions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  debit_wallet_transactions.init(
    {
      bank_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      reference_from_etranzact: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      destination: {
        type: DataTypes.STRING,
      },
      sender_name: {
        type: DataTypes.TEXT,
      },
      endPoint: {
        type: DataTypes.TEXT,
      },
      terminal_id: {
        type: DataTypes.STRING,
      },
      storm_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('approved', 'declined'),
        allowNull: false,
        validate: { isIn: [['approved', 'declined']] },
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      response_code: {
        type: DataTypes.STRING,
      },
      response_message: {
        type: DataTypes.STRING,
      },
      transaction_fee: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
    },
    {
      sequelize,
      modelName: 'debit_wallet_transactions',
    }
  );
  return debit_wallet_transactions;
};