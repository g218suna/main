'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IdeaNodes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  IdeaNodes.init({
    rootID: DataTypes.INTEGER,
    elementID: DataTypes.INTEGER,
    elementContents: DataTypes.STRING,
    elementNote: DataTypes.TEXT,
    elementURL: DataTypes.STRING,
    elementAttachment: DataTypes.STRING,
    elementImage: DataTypes.STRING,
    elementStyle: DataTypes.STRING,
    elementBackColor: DataTypes.STRING,
    elementFontStyle: DataTypes.STRING,
    elementFontSize: DataTypes.INTEGER,
    elementFontColor: DataTypes.STRING,
    elementBorderStyle: DataTypes.STRING,
    elementBorderColor: DataTypes.STRING,
    parentNodeID: DataTypes.INTEGER,
    childNodeID: DataTypes.INTEGER,
    branchID: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'IdeaNodes',
  });
  return IdeaNodes;
};