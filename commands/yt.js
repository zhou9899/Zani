// commands/yt.js - FIXED FOR ALL VIDEO TYPES
import play from "play-dl";
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

export const name = "yt";
export const description = "Download YouTube video";

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!args.length) {
        return sock.sendMessage(jid, { text: "❌ Provide YouTube URL or search term." }, { quoted: msg });
    }

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `video-${Date.now()}.mp4`);

    try {
        let url = args[0];
        let title = "YouTube Video";
        
        // If it's not a URL, search for it
        if (!url.startsWith('http')) {
            const results = await play.search(args.join(" "), { limit: 1 });
            if (!results.length) return sock.sendMessage(jid, { text: "❌ No videos found." }, { quoted: msg });
            url = results[0].url;
            title = results[0].title;
        } else {
            // If it's a URL, get the title
            const results = await play.search(url, { limit: 1 });
            if (results.length) title = results[0].title;
        }

        await sock.sendMessage(jid, { text: `⬇️ Downloading: *${title}*` }, { quoted: msg });

        // MORE FLEXIBLE format selection - handles Shorts, regular videos, etc.
        await youtubedl(url, {
            format: 'best[filesize<20M]', // Only size restriction (20MB WhatsApp limit)
            output: tempFile,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            socketTimeout: 30000,
            retries: 3
        });

        // Send the video
        await sock.sendMessage(jid, {
            video: fs.readFileSync(tempFile),
            caption: `🎥 ${title}`
        }, { quoted: msg });

        // Clean up
        fs.unlinkSync(tempFile);

    } catch (err) {
        console.error("❌ Error in .yt command:", err);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        
        if (err.stderr && err.stderr.includes('Requested format is not available')) {
            await sock.sendMessage(jid, { text: "❌ No suitable format under 20MB found. Try a shorter video." }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
        }
    }
}
