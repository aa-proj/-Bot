import {
  ActionRowBuilder,
  ButtonBuilder,
  Client,
  IntentsBitField,
  ButtonStyle,
  Message,
  TextChannel
} from "discord.js";
import {Connection, ConnectionOptions, createConnection} from "typeorm";
import {User} from "./eneity/User";
import {Furo} from "./eneity/furo";
import {getTimeFromMills, giveAAPoint} from "./util";


// const bathReaction = "<:nyuyoku:885703314417807420>";
const bathReactionId = "885703314417807420"
const dailyBotChannel = "803321643803213834";
const generalChannel = "606109479003750442";
const guildID = "606109479003750440";

// Discordクライアント
const client = new Client(
  {
    intents:
      [IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions
      ]
  });


// TypeORMのオプション
const options: ConnectionOptions = {
  type: "sqlite",
  database: "./db/db.sqlite3",
  entities: [User, Furo],
  synchronize: false,
};

// TypeORMのコネクション 使う前にnullチェックが必要
let connection: Connection | null = null;

async function connectDB() {
  connection = await createConnection(options);
  await connection.query("PRAGMA foreign_keys=OFF");
  await connection.synchronize();
  await connection.query("PRAGMA foreign_keys=ON");
  console.log("DB Connected!!")
}

// コネクションする
connectDB();

// // rawイベントを取得 リアクションのイベントを発火させてる
// client.on("raw", (reaction) => {
//     switch (reaction.t) {
//         case "MESSAGE_REACTION_ADD":
//             msgReactionAdd(reaction.d);
//             break;
//     }
// });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() || !interaction.guildId) {
    return;
  }
  const g = client.guilds.cache.get(interaction.guildId);
  const general: TextChannel = <TextChannel>await g?.channels.fetch(generalChannel);
  const messageUser = interaction.user;
  const messageUserId = interaction.user.id;
  const command = interaction.customId;
  if (messageUser.bot) return;

  const userRepository = connection?.getRepository(User);
  const furoRepository = connection?.getRepository(Furo);
  const user = await userRepository?.findOne({discordId: messageUserId});
  const furoUser = await furoRepository?.findOne({where: {user: user}, order: {time: "DESC"}});
  const furoTime = furoUser?.time

  if (!user) {
    // Userが未登録だった時
    const newUser = userRepository?.create({
      discordId: messageUserId,
    });
    await userRepository?.save(<User>newUser);
  }
  {
    switch (command) {
      case "Furo":
        const furoTransaction = furoRepository?.create({
          time: new Date(),
          user: user,
        });
        furoRepository?.save(<Furo>furoTransaction);
        if (!furoTime) {
          await general.send(
            getNameFromID(messageUserId) +
            "は初めてお風呂に入りました"
          );
        } else {
          const aap = calcAAPoint((new Date().getTime()) - (new Date(furoTime).getTime()))
          if (aap !== 0) {
            await giveAAPoint(messageUserId, aap)
          }
          await general.send(
            getNameFromID(messageUserId) +
            "は" +
            getTimeFromMills((new Date().getTime()) - (new Date(furoTime).getTime()))
            + "ぶりにお風呂に入りました\n"
            + `${aap}ああP付与されました`
          );
        }
        break;
    }
  }
  await interaction.reply({content: "OK", ephemeral: true});
})

function calcAAPoint(time: number): number {
  const hour = Math.ceil(time / (1000 * 60 * 60))
  if (0 <= hour && hour < 6) {
    return 0
  } else if (6 <= hour && hour < 18) {
    return 6
  } else if (18 <= hour && hour < 36) {
    return 12
  } else {
    return 0
  }
}

// メッセージが来たとき
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith("/bath")) return;
  // 引数をパース
  const args = msg.content.replace(/　+/g, " ").slice(5).trim().split(/ + /);
  switch (args[0]) {
    case "init":
      await initBotMessage(msg);
      break;
  }
});

// discord uid からニックネームをとってくるメソッド
function getNameFromID(id: string) {
  let g = client.guilds.cache.get(guildID);
  let nickName = g?.members.cache.get(id)?.nickname?.replace("@", "＠");
  if (!nickName) nickName = g?.members.cache.get(id)?.displayName;
  return nickName;
}

// 今リアクションを待機してるメッセージ
let nowMessage: Message | null = null;

async function initBotMessage(msg: Message) {

  const channel: TextChannel = (await client.channels.fetch(dailyBotChannel)) as TextChannel;
  const action = new ActionRowBuilder()
    .addComponents([
        new ButtonBuilder()
          .setCustomId("Furo")
          .setLabel("風呂")
          .setStyle(ButtonStyle.Success)
          .setEmoji(bathReactionId)
      ]
    );
  // @ts-ignore
  await channel.send({content: "お風呂に入ったらリアクションしてください", components: [action]});
}

// DiscordBotがいい感じになったとき
client.on("ready", () => {
  console.log("Discord Bot Ready");
});

client.login(process.env.FURO_TOKEN);
