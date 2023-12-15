import { DataTypes, type Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  return sequelize.define("User", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    updatedAt: "updateTime", // 自定义这两个字段的名称
    createdAt: "createTime", // 同上
    // timestamps: {
    //   createdAt: 'customCreatedAt', // 修改 createdAt 的名称为 customCreatedAt
    //   updatedAt: 'customUpdatedAt', // 修改 updatedAt 的名称为 customUpdatedAt
    // },
  }
  );
};
