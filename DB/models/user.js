'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({
      transactions,
      storm_wallet,
      merchant_transaction_cache,
      terminal_id
    }) {
      this.hasMany(transactions, {
        foreignKey: 'storm_id',
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      });
      this.hasOne(storm_wallet, {
        foreignKey: 'storm_id',
        onUpdate: 'NO ACTION',
        onDelete: 'CASCADE',
      });
      this.hasMany(merchant_transaction_cache, {
        foreignKey: 'storm_id',
        onUpdate: 'NO ACTION',
        onDelete: 'CASCADE',
      });
     
    }

    toJSON() {
      return { ...this.get(), id: undefined };
    }
  }
  user.init(
    {
      storm_id: {
        type: DataTypes.UUID,
        primaryKey: true,

        defaultValue: DataTypes.UUIDV4,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          notNull: true,
        },
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: { notNull: true },
      },
      business_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: { notNull: true },
      },
      mobile_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: { notNull: true },
      },
      account_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: { notNull: true },
      },
      bvn: {
        type: DataTypes.STRING,
        allowNull: false,
        validator: { notNull: true },
      },
      type: {
        type: DataTypes.ENUM('merchant', 'agent_1', 'agent_2'),
        validate: { isIn: [['merchant', 'agent_1', 'agent_2']] },
        allowNull: true,
        defaultValue: 'agent_2',
      },
      terminal_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        
      },
      is_transfer_enabled: {
        type: DataTypes.ENUM('true', 'false'),
        allowNull: false,
        defaultValue: 'false',
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
        default: 'user',
      },
      
    },

    {
      sequelize,
      modelName: 'user',
    }
  );
  return user;
};