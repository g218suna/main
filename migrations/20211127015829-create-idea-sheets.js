'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IdeaSheets', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: false,
        type: Sequelize.INTEGER,
        comment: "ユーザーＩＤ"
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: "メールアドレス"
      },
      nickName: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: "公開される名前"
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: "タイトル"
      },
      rootID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: "マインドマップのルートのＩＤ"
      },
      rootName: {
        allowNull: true,
        type: Sequelize.STRING,
        comment: "マインドマップのルートの名前"
      },
      sharingSetting: {
        defaultValue: false,
        type: Sequelize.BOOLEAN,
        comment: "公開>Yes/非公開>No"
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
    await queryInterface.dropTable('IdeaSheets');
  }
};