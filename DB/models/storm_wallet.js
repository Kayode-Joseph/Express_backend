'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class storm_wallet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  storm_wallet.init(
    {
      terminal_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      wallet_balance: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
      sequelize,
      modelName: 'storm_wallet',
    }
  );
  return storm_wallet;
};