'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({superadmin}) {
     this.belongsTo(superadmin)
    }
  }
  admin.init(
    {
      admin_id: {
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
      password: { type: DataTypes.STRING, allowNull: false },
      business_name: { type: DataTypes.STRING, allowNull: false },
      mobile_number: { type: DataTypes.STRING, allowNull: false },
      account_number: { type: DataTypes.STRING, allowNull: false },
      bvn: { type: DataTypes.STRING, allowNull: false },

      super_user: {type: DataTypes.STRING, allowNull:false 
      
      }


    },
    {
      sequelize,
      modelName: 'admin',
    }
  );
  return admin;
};