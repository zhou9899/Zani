import fs from "fs";
import path from "path";

export const name = "kiss";
export const description = "Send a kiss GIF/MP4";

export async function execute(sock, msg, args) {
    const kissFolder = path.join(process.cwd(), "media/kiss/optimized");

    if (!fs.existsSync(kissFolder)) fs.mkdirSync(kissFolder, { recursive: true });

    const files = fs.readdirSync(kissFolder);

    if (files.length === 0) {
        return await sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ No kiss GIFs/MP4s found! Add some files to media/kiss/optimized" },
            { quoted: msg }
        );
    }

    // Pick random GIF/MP4
    const randomVideo = files[Math.floor(Math.random() * files.length)];
    const videoPath = path.join(kissFolder, randomVideo);

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
        caption = `💋 @${senderNumber} gave a sweet kiss to @${targetJid.split("@")[0]} 😘`;
        mentions = [senderJid, targetJid];
    } else {
        caption = `💋 @${senderNumber} kissed themselves... so cute 🥺`;
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
