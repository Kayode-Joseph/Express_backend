'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaction_fees extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  transaction_fees.init(
    {
      agent_type: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      transaction_percentage: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },
      cap: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },

      transfer_out_fee: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },
      max_debit_amount: {
        type: DataTypes.DOUBLE,

        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'transaction_fees',
    }
  );
  return transaction_fees;
};
