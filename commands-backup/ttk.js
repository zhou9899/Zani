import fs from "fs";
import path from "path";
import axios from "axios";

export const name = "ttk";
export const description = "Download Tiktok video without watermark";

export async function execute(sock, msg, args) {
    const prefix = ".";
    const jid = msg.key.remoteJid;

    if (!args[0]) {
        return sock.sendMessage(jid, { text: `⚠️ Usage: ${prefix}ttk <TikTok URL>` }, { quoted: msg });
    }

    try {
        const url = args[0];

        // Using a free API or workaround to get TikTok video URL
        const apiUrl = `https://api.tikdown.org/api/download?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        const videoUrl = response.data?.video?.no_watermark;

        if (!videoUrl) {
            return sock.sendMessage(jid, { text: "❌ Failed to fetch video." }, { quoted: msg });
        }

        const videoPath = path.resolve("./temp/video.mp4");
        const writer = fs.createWriteStream(videoPath);
        const videoResp = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
        videoResp.data.pipe(writer);

        writer.on("finish", async () => {
            await sock.sendMessage(
                jid,
                { video: fs.readFileSync(videoPath), mimetype: "video/mp4", caption: "TikTok Video" },
                { quoted: msg }
            );
            fs.unlinkSync(videoPath);
        });
    } catch (err) {
        console.error("❌ Error executing ttk:", err);
        await sock.sendMessage(jid, { text: "⚠️ Failed to download TikTok video." }, { quoted: msg });
    }
}
