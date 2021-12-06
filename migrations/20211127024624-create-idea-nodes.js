'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IdeaNodes', {
      rootID: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: "ルートのＩＤ"
      },
      elementID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: "要素のＩＤ"
      },
      elementContents: {
        type: Sequelize.STRING,
        comment: "要素のＩＤ"
      },
      elementNote: {
        type: Sequelize.TEXT,
        comment: "要素のメモ"
      },
      elementURL: {
        type: Sequelize.STRING,
        comment: "要素に付けるＵＲＬ"
      },
      elementAttachment: {
        type: Sequelize.STRING,
        comment: "要素に添付するファイル"
      },
      elementImage: {
        type: Sequelize.STRING,
        comment: "要素のイメージ画像"
      },
      elementStyle: {
        type: Sequelize.STRING,
        comment: "要素のスタイル"
      },
      elementBackColor: {
        type: Sequelize.STRING,
        comment: "要素の背景色"
      },
      elementFontStyle: {
        type: Sequelize.STRING,
        comment: "要素のフォントスタイル"
      },
      elementFontSize: {
        type: Sequelize.INTEGER,
        comment: "要素のフォントサイズ"
      },
      elementFontColor: {
        type: Sequelize.STRING,
        comment: "要素のフォント色"
      },
      elementBorderStyle: {
        type: Sequelize.STRING,
        comment: "要素の境界線のスタイル"
      },
      elementBorderColor: {
        type: Sequelize.STRING,
        comment: "要素の境界線の色"
      },
      parentNodeID: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: "親要素のＩＤ"
      },
      childNodeID: {
        type: Sequelize.INTEGER,
        comment: "子要素のID"
      },
      branchID: {
        type: Sequelize.INTEGER,
        comment: "枝のＩＤ"
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
    await queryInterface.dropTable('IdeaNodes');
  }
};