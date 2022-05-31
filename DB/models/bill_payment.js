'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class bill_payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  bill_payment.init(
    {
      client_ref: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      storm_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.BOOLEAN,
      },
      message: {
        type: DataTypes.TEXT,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
      product_id: {
        type: DataTypes.STRING,
      },
      bill_id: {
        type: DataTypes.STRING,
      },

      customer_id: {
        type: DataTypes.STRING,
      },
      bill_name: {
        type: DataTypes.STRING,
      },
      bill_query_ref: {
        type: DataTypes.STRING,
      },
      transaction_fee:{

        type: DataTypes.DOUBLE
      },
      user_type:{
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'bill_payment',
    }
  );
  return bill_payment;
};