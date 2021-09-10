import {Client, Emoji, Message, TextChannel} from "discord.js";
import {Connection, ConnectionOptions, createConnection} from "typeorm";
import {User} from "./eneity/User";
import {Furo} from "./eneity/furo";


const bathReaction = "<:nyuyoku:885703314417807420>";
const dailyBotChannel = "803321643803213834";
const generalChannel = "606109479003750442";
const guildID = "606109479003750440";

// Discordクライアント
const client = new Client();

// リアクションされたときのインターフェース
interface IReaction {
    user_id: string; // Discord uid
    message_id: string; // Message id
    emoji: Emoji; // EmojiResolvable
    channel_id: string; // ChannelID
    guild_id: string; // GuildID
}

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

// rawイベントを取得 リアクションのイベントを発火させてる
client.on("raw", (reaction) => {
    switch (reaction.t) {
        case "MESSAGE_REACTION_ADD":
            msgReactionAdd(reaction.d);
            break;
    }
});


// メッセージにリアクションがあったとき
async function msgReactionAdd(reaction: IReaction) {
    let g = client.guilds.cache.get(reaction.guild_id);
    const general = <TextChannel>g?.channels.cache.get(generalChannel); // TODO

    if (g?.member(reaction.user_id)?.user.bot) return;
    const userRepository = connection?.getRepository(User);
    const furoRepository = connection?.getRepository(Furo);
    const user = await userRepository?.findOne({ discordId: reaction.user_id });
    const furoUser = await furoRepository?.findOne({where:{user: user},order:{time:"DESC"}});
    const furoTime = furoUser?.time

    if (!user) {
        // Userが未登録だった時
        const newUser = userRepository?.create({
            discordId: reaction.user_id,
        });
        await userRepository?.save(<User>newUser);
    }
    {
        switch (reaction.emoji.name) {
            case "nyuyoku":
                if (true) {
                    const furoTransaction = furoRepository?.create({
                        time: new Date(),
                        user: user,
                    });
                    furoRepository?.save(<Furo>furoTransaction);
                    if(!furoTime) {
                        await general.send(
                            getNamefromID(reaction.user_id) +
                            "は初めてお風呂に入りました"
                        );
                    } else {
                        await general.send(
                            getNamefromID(reaction.user_id) +
                            "は" +
                            getTimeFromMills((new Date().getTime()) - (new Date(furoTime).getTime()))
                            + "ぶりにお風呂に入りました"
                        );
                    }
                }
                initMsg();
                break;
        }
    }
}


// メッセージが来たとき
client.on("message", async (msg) => {
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
function getNamefromID(id: string) {
    let g = client.guilds.cache.get(guildID);
    let nickName = g?.member(id)?.nickname?.replace("@", "＠");
    if (!nickName) nickName = g?.member(id)?.displayName;
    return nickName;
}

// 今リアクションを待機してるメッセージ
let nowMessage: Message | null = null;

async function initBotMessage(msg: Message) {
    const msgRes = await (<TextChannel>client.channels.cache.get(dailyBotChannel)).send(
        "お風呂に入ったらリアクションしてください"
    );
    await msgRes.react(bathReaction);
    nowMessage = msgRes;
    await msg.delete();
}


function initMsg() {
    if (!nowMessage) {
        console.log("not initialized");
        return;
    }
    nowMessage.reactions.removeAll().then(() => {
        nowMessage?.react(bathReaction);
    });
}



// ミリ秒を x時間x分x秒にするやつ いらない単位は消える
function getTimeFromMills(m: number) {
    let byo: number = Math.floor(m / 1000) % 60;
    let hun: number = Math.floor(m / 60000) % 60;
    let ji: number = Math.floor(m / 3600000);
    let result = "";
    if (ji != 0) result += ji + "時間 ";
    if (hun != 0) result += hun + "分 ";
    if (byo != 0) result += byo + "秒";
    return result;
}

// DiscordBotがいい感じになったとき
client.on("ready", () => {
    console.log("Discord Bot Ready");
});

client.login(process.env.FURO_TOKEN);