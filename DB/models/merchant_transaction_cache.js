'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class merchant_transaction_cache extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({user}) {
      this.belongsTo(user, { foreignKey: 'storm_id' });
    }
  }
  merchant_transaction_cache.init(
    {
      storm_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validator: { notNull: true },
      },
      rrn: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        validator: { notNull: true },
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validator: { notNull: true, isDecimal: true },
      },
    },
    {
      sequelize,
      modelName: 'merchant_transaction_cache',
    }
  );
  return merchant_transaction_cache;
};