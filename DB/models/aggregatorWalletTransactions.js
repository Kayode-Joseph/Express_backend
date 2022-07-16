'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class aggregatorWalletTransactions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({aggregators }) {

       this.belongsTo(aggregators, { foreignKey: 'aggregator_id' });

    }
  }
  aggregatorWalletTransactions.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        unique: true,
        type: DataTypes.INTEGER,
      },

      aggregator_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey:true,
        references: {
          model: 'aggregators',
          key: 'id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      reference: {
        type: DataTypes.STRING,
        allowNull:false
      },
      amount: {
        type: DataTypes.FLOAT,
        defaultValue: '0.00',
        validator: { notNull: true, isDecimal: true },
      },
      bank_code: DataTypes.STRING,

      reference_from_etranzact: DataTypes.STRING,
      description: DataTypes.STRING,
      destination: DataTypes.STRING,
      sender_name: DataTypes.STRING,
      endPoint: DataTypes.STRING,

      response_message: DataTypes.STRING,
      transaction_fee: {
        type: DataTypes.DOUBLE,
        defaultValue: '0.00',
      },
    },
    {
      sequelize,
      modelName: 'aggregatorWalletTransactions',
    }
  );
  return aggregatorWalletTransactions;
};