'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IdeaBranches extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  IdeaBranches.init({
    elementID: DataTypes.INTEGER,
    branchID: DataTypes.INTEGER,
    branchStyle: DataTypes.STRING,
    branchColor: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'IdeaBranches',
  });
  return IdeaBranches;
};