import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";
import playdl from "play-dl";

const MAX_AUDIO_MB = 20; // adjust if needed

export async function playAudio(sock, jid, msg, query, retryCount = 0) {
    try {
        // Search YouTube
        const results = await playdl.search(query, { limit: 1 });
        if (!results.length) return await sock.sendMessage(jid, { text: "❌ No results found." }, { quoted: msg });

        const url = results[0].url;
        const info = await ytdl.getInfo(url);

        // Pick best audio format under MAX_AUDIO_MB
        const format = info.formats
            .filter(f => f.hasAudio && !f.hasVideo && f.contentLength)
            .map(f => ({ ...f, sizeMB: parseInt(f.contentLength) / (1024 * 1024) }))
            .filter(f => f.sizeMB <= MAX_AUDIO_MB)
            .sort((a, b) => b.audioBitrate - a.audioBitrate)[0];

        if (!format) return await sock.sendMessage(jid, { text: `❌ No audio under ${MAX_AUDIO_MB} MB found.` }, { quoted: msg });

        // Download to temp file
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFile = path.join(tempDir, `play-${Date.now()}.mp3`);

        const stream = ytdl(url, { format });
        const writeStream = fs.createWriteStream(tempFile);

        stream.pipe(writeStream);

        writeStream.on("finish", async () => {
            try {
                await sock.sendMessage(jid, {
                    audio: fs.readFileSync(tempFile),
                    mimetype: "audio/mp4",
                    ptt: false,
                    caption: `🎵 ${info.videoDetails.title}`
                }, { quoted: msg });
            } catch (err) {
                console.error("❌ Failed to send audio:", err);
                await sock.sendMessage(jid, { text: "❌ Failed to send audio." }, { quoted: msg });
            } finally {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            }
        });

        stream.on("error", async err => {
            console.error("❌ Audio download error:", err);
            if (retryCount < 3) {
                await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
                await playAudio(sock, jid, msg, query, retryCount + 1);
            } else {
                await sock.sendMessage(jid, { text: "❌ Failed to download audio after multiple retries." }, { quoted: msg });
            }
        });
    } catch (err) {
        console.error("❌ Error in playAudio helper:", err);
        await sock.sendMessage(jid, { text: "❌ Failed to fetch/send audio." }, { quoted: msg });
    }
}
