import fs from 'fs';
import path from 'path';

export const name = 'hug';
export const description = 'Send a hug GIF/MP4';

export async function execute(sock, msg, args) {
    const hugFolder = path.join(process.cwd(), 'media/hug/optimized');

    // Auto-create folder if it doesn't exist
    if (!fs.existsSync(hugFolder)) fs.mkdirSync(hugFolder, { recursive: true });

    const files = fs.readdirSync(hugFolder);

    if (files.length === 0) {
        return await sock.sendMessage(
            msg.key.remoteJid,
            { text: 'No hug GIFs/MP4s found! Add some files to media/hug/optimized.' },
            { quoted: msg }
        );
    }

    // Pick a random MP4/GIF
    const randomVideo = files[Math.floor(Math.random() * files.length)];
    const videoPath = path.join(hugFolder, randomVideo);

    await sock.sendMessage(
        msg.key.remoteJid,
        { video: fs.readFileSync(videoPath), gifPlayback: true, caption: `${msg.pushName || 'Someone'} sends a hug! 🤗` },
        { quoted: msg }
    );
}
