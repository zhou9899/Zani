
// commands/play.js - PYTHON POWERED (FAST)
import play from "play-dl";
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

export const name = "play";
export const description = "Search YouTube and download audio";

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!args.length) {
        return sock.sendMessage(jid, { text: "❌ Provide a search term." }, { quoted: msg });
    }

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `audio-${Date.now()}.mp3`);

    try {
        // 1. FAST SEARCH with play-dl
        const results = await play.search(args.join(" "), { limit: 1 });
        if (!results.length) return sock.sendMessage(jid, { text: "❌ No results found." }, { quoted: msg });

        const url = results[0].url;
        await sock.sendMessage(jid, { text: `⬇️ Downloading: *${results[0].title}*` }, { quoted: msg });

        // 2. SUPER FAST DOWNLOAD with yt-dlp (Python)
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '4', // Balanced quality/speed (0=best, 9=worst)
            output: tempFile,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            socketTimeout: 30000,
            retries: 3
        });

        // 3. SEND AUDIO
        await sock.sendMessage(jid, {
            audio: fs.readFileSync(tempFile),
            mimetype: 'audio/mpeg',
            fileName: `${results[0].title}.mp3`,
            ptt: false,
            caption: `🎵 ${results[0].title}`
        }, { quoted: msg });

        // Clean up
        fs.unlinkSync(tempFile);

    } catch (err) {
        console.error("❌ Error in .play command:", err);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        await sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
    }
}
