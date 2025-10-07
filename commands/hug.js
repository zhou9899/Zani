import fs from "fs";
import path from "path";

export const name = "hug";
export const description = "Send a hug GIF/MP4";

export async function execute(sock, msg, args) {
    const hugFolder = path.join(process.cwd(), "media/hug/optimized");

    if (!fs.existsSync(hugFolder)) fs.mkdirSync(hugFolder, { recursive: true });

    const files = fs.readdirSync(hugFolder);

    if (files.length === 0) {
        return await sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ No hug GIFs/MP4s found! Add some files to media/hug/optimized" },
            { quoted: msg }
        );
    }

    // Pick random GIF/MP4
    const randomVideo = files[Math.floor(Math.random() * files.length)];
    const videoPath = path.join(hugFolder, randomVideo);

    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split("@")[0];

    // 1️⃣ Mention check
    let targetJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    // 2️⃣ Reply check if no mention
    if (!targetJid && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
    }

    let caption, mentions;

    if (targetJid) {
        caption = `🤗 @${senderNumber} gave a warm hug to @${targetJid.split("@")[0]} ❤️`;
        mentions = [senderJid, targetJid];
    } else {
        caption = `🤗 @${senderNumber} hugged themselves... aww 🥺`;
        mentions = [senderJid];
    }

    await sock.sendMessage(
        msg.key.remoteJid,
        {
            video: fs.readFileSync(videoPath),
            gifPlayback: true,
            caption,
            mentions,
        },
        { quoted: msg }
    );
}
