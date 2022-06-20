'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class bills_rate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  bills_rate.init(
    {
      bill_name: { type: DataTypes.STRING, allowNull: false },
      bill_id: { type: DataTypes.STRING, allowNull: false },
      rate: { type: DataTypes.DOUBLE },

      cap: {
        type: DataTypes.DOUBLE,
      },

      bill_category: DataTypes.STRING,
    },
    
    {
      sequelize,
      modelName: 'bills_rate',
    }
  );
  return bills_rate;
};
