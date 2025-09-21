
import fs from "fs";
import path from "path";

export const name = "pat";
export const description = "Send a pat GIF/MP4";

export async function execute(sock, msg, args) {
    const patFolder = path.join(process.cwd(), "media/pat/optimized");

    // Ensure folder exists
    if (!fs.existsSync(patFolder)) {
        fs.mkdirSync(patFolder, { recursive: true });
    }

    // Get only .mp4 or .gif files
    const files = fs.readdirSync(patFolder).filter(f => f.endsWith(".mp4") || f.endsWith(".gif"));

    if (files.length === 0) {
        return await sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ No pat GIFs/MP4s found! Add some files to media/pat/optimized" },
            { quoted: msg }
        );
    }

    // Pick random file
    const randomIndex = Math.floor(Math.random() * files.length);
    const randomVideo = files[randomIndex];
    console.log("Selected pat video:", randomVideo); // Debug

    const videoPath = path.join(patFolder, randomVideo);
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split("@")[0];

    // Mention check
    let targetJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    // Reply check if no mention
    if (!targetJid && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
    }

    let caption, mentions;

    if (targetJid) {
        caption = `@${senderNumber} pats @${targetJid.split("@")[0]}`;
        mentions = [senderJid, targetJid];
    } else {
        caption = `@${senderNumber} pats`;
        mentions = [senderJid];
    }

    // Send the video
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

