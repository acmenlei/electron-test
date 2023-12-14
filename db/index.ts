import { Sequelize } from "sequelize";
import { join } from "path"
import Model from "./models/User";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: join(__dirname, '..', 'database.sqlite'), // 指定 SQLite 数据库文件路径
});

const User = Model(sequelize);

// 进行同步，创建表
sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

export default { sequelize, User };
