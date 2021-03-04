import { Client } from "discord.js";
import {Connection, ConnectionOptions, createConnection} from "typeorm";

// Discordクライアント
const client = new Client();

// TypeORMのオプション
const options: ConnectionOptions = {
  type: "sqlite",
  database: "./db/db.sqlite3",
  entities: [],
  synchronize: false,
};

// TypeORMのコネクション 使う前にnullチェックが必要
let connection: Connection | null = null;

async function connectDB() {
  connection = await createConnection(options);
  await connection.query("PRAGMA foreign_keys=OFF");
  await connection.synchronize();
  await connection.query("PRAGMA foreign_keys=ON");
}

// コネクションする
connectDB();

// DiscordBotがいい感じになったとき
client.on("ready", () => {
  console.log("Discord Bot Ready");
});
