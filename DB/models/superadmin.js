'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class superadmin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({admin}) {
      this.hasMany(admin)
    }
  }
  superadmin.init({
    email: {type: DataTypes.STRING,
      primaryKey:true
    },
    password: {
    allowNull:false
      ,type:DataTypes.STRING}
  }, {
    sequelize,
    modelName: 'superadmin',
  });
  return superadmin;
};