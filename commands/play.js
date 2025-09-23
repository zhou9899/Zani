// commands/play.js - FAST AUDIO WITH VIDEO COVER IMAGE
import play from "play-dl";
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const name = "play";
export const description = "Search YouTube and download audio";

function cleanupFiles(...files) {
    files.forEach(file => {
        if (fs.existsSync(file)) {
            try { fs.unlinkSync(file); } catch { }
        }
    });
}

async function sendCoverImage(coverUrl, title, jid, sock, msg) {
    if (!coverUrl) {
        await sock.sendMessage(jid, { text: `🎵 ${title}` }, { quoted: msg });
        return;
    }
    try {
        const response = await axios.get(coverUrl, { responseType: 'stream', timeout: 10000 });
        await sock.sendMessage(jid, {
            image: { stream: response.data },
            caption: `🎵 ${title}`,
        }, { quoted: msg });
    } catch {
        await sock.sendMessage(jid, { text: `🎵 ${title}` }, { quoted: msg });
    }
}

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!args.length) {
        return await sock.sendMessage(jid, { text: "❌ Provide a search term." }, { quoted: msg });
    }

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempAudio = path.join(tempDir, `audio-${Date.now()}.mp3`);

    try {
        // 1. Search YouTube quickly
        const results = await play.search(args.join(" "), { limit: 1 });
        if (!results.length) return await sock.sendMessage(jid, { text: "❌ No results found." }, { quoted: msg });

        const video = results[0];
        const url = video.url;
        const title = video.title?.substring(0, 256) || 'Unknown Title';
        const coverUrl = video.thumbnails?.[0]?.url;

        // 2. Send video cover thumbnail with title
        await sendCoverImage(coverUrl, title, jid, sock, msg);

        // 3. Download audio SUPER FAST with yt-dlp
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '4',
            output: tempAudio,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            socketTimeout: 30000,
            retries: 3
        });

        // 4. Send audio only, quoted
        await sock.sendMessage(jid, {
            audio: fs.readFileSync(tempAudio),
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: false
        }, { quoted: msg });

    } catch (err) {
        console.error("❌ Error in .play command:", err);
        await sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
    } finally {
        cleanupFiles(tempAudio);
    }
}
