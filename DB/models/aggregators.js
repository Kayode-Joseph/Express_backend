'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class aggregators extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({aggregator_wallet}) {
         this.hasOne(aggregator_wallet, {
           foreignKey: 'aggregator_id',
          
           onUpdate: 'NO ACTION',
           onDelete: 'CASCADE',
         });
    }
  }
  aggregators.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,

        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: {
          isEmail: true,
          notNull: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: {
          length: [3, 99],
          notNull: true,
        },
        phoneNumber: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'aggregators',
    }
  );
  return aggregators;
};