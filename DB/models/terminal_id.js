'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class terminal_id extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({user}) {
      this.hasOne(user)
    }
  }
  terminal_id.init(
    {
      terminal_id: { type: DataTypes.STRING, primaryKey: true },
      merchant_id: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: 'terminal_id',
    }
  );
  return terminal_id;
};