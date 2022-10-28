// ミリ秒を x時間x分x秒にするやつ いらない単位は消える
import axios from "axios";

export const getTimeFromMills = (m: number) => {
    let byo: number = Math.floor(m / 1000) % 60;
    let hun: number = Math.floor(m / 60000) % 60;
    let ji: number = Math.floor(m / 3600000);
    let result = "";
    if (ji != 0) result += ji + "時間 ";
    if (hun != 0) result += hun + "分 ";
    if (byo != 0) result += byo + "秒";
    return result;
};

export const giveAAPoint = async (id: string, point: number) => {
    await generateMoneyById(id, point);
};

async function sendMoneyById(fromId: number | string, toId: number | string, amount: number, memo: string = ""): Promise<boolean> {
    const sendBody = { fromId: fromId.toString(), toId: toId.toString(), amount, memo };
    // console.log(sendBody)
    const { data } = await axios.post("https://bank.ahoaho.jp/", sendBody);
    if (!data.success) throw new Error(data.message);
    return true;
}

async function generateMoneyById(toId: number | string, amount: number): Promise<boolean> {
    const result = await sendMoneyById("885834421771567125", toId, amount);
    return result;
}

