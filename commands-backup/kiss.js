import fs from 'fs';
import path from 'path';

export const name = 'kiss';
export const description = 'Send a kiss GIF/MP4';

export async function execute(sock, msg, args) {
    const kissFolder = path.join(process.cwd(), 'media/kiss/optimized');

    // Auto-create folder if it doesn't exist
    if (!fs.existsSync(kissFolder)) fs.mkdirSync(kissFolder, { recursive: true });

    const files = fs.readdirSync(kissFolder);

    if (files.length === 0) {
        return await sock.sendMessage(
            msg.key.remoteJid,
            { text: 'No kiss GIFs/MP4s found! Add some files to media/kiss/optimized.' },
            { quoted: msg }
        );
    }

    // Pick a random MP4/GIF
    const randomVideo = files[Math.floor(Math.random() * files.length)];
    const videoPath = path.join(kissFolder, randomVideo);

    await sock.sendMessage(
        msg.key.remoteJid,
        { video: fs.readFileSync(videoPath), gifPlayback: true, caption: `${msg.pushName || 'Someone'} sends a kiss! 😘` },
        { quoted: msg }
    );
}
