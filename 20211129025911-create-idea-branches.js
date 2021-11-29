'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IdeaBranches', {
      elementID: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: "要素のID"
      },
      branchID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: "枝のＩＤ"
      },
      branchStyle: {
        type: Sequelize.STRING,
        comment: "枝のスタイル"
      },
      branchColor: {
        type: Sequelize.STRING,
        comment: "枝の色"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('IdeaBranches');
  }
};