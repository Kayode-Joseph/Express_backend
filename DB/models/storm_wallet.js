'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class storm_wallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ user }) {
      this.belongsTo(user, { foreignKey: 'storm_id' });
    }
  }
  storm_wallet.init(
      {
          storm_id: {
              type: DataTypes.STRING,
              allowNull: false,
              primaryKey: true,
          },
          wallet_balance: {
              type: DataTypes.FLOAT,
              allowNull: false,
              validator: { notNull: true, isDecimal: true },
          },
          ledger_balance: {
              type: DataTypes.FLOAT,
              allowNull: false,
              validator: { notNull: true, isDecimal: true },
          },
          pin: {
              type: DataTypes.STRING,
              allowNull: false,
          },
          isBusy: {
              allowNull: false,
              defaultValue: false,
              type: DataTypes.BOOLEAN,
          },
      },
      {
          sequelize,
          modelName: 'storm_wallet',
      }
  );
  return storm_wallet;
};
