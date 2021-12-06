'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IdeaSheets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  IdeaSheets.init({
    email: DataTypes.STRING,
    nickName: DataTypes.STRING,
    title: DataTypes.STRING,
    rootId: DataTypes.INTEGER,
    rootName: DataTypes.STRING,
    sharingSetting: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'IdeaSheets',
  });
  return IdeaSheets;
};