// commands/ig.js
import { spawn } from "child_process";

async function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      "-f", "best[ext=mp4]/best",  // just grab the best available mp4
      "-o", "-",
      "--quiet",                  // no logs
      "--no-warnings",
      "--no-part",
      url
    ]);

    const chunks = [];
    ytdlp.stdout.on("data", (chunk) => chunks.push(chunk));

    ytdlp.stderr.on("data", (d) => {
      const msg = d.toString().trim();
      if (msg) console.error("yt-dlp error:", msg);
    });

    ytdlp.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`yt-dlp failed with code ${code}`));
    });

    ytdlp.on("error", reject);
  });
}

export default {
  name: "ig",
  description: "Download Instagram reels and send to WhatsApp buffer",
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    if (!args[0]) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Provide an Instagram URL\n\nExample: .ig https://www.instagram.com/reel/xxxx/" },
        { quoted: msg }
      );
    }

    const instagramUrl = args[0];

    if (!instagramUrl.match(/instagram\.com\/(reel|p|stories|tv)/)) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Invalid Instagram URL (reel, post, story, or IG TV only)" },
        { quoted: msg }
      );
    }

    try {
      // Send "please wait" message
      await sock.sendMessage(
        chatId,
        { text: "⏳ Please wait, Instagram video is downloading..." },
        { quoted: msg }
      );

      const videoBuffer = await downloadToBuffer(instagramUrl);

      if (!videoBuffer || videoBuffer.length === 0) {
        throw new Error("Empty video buffer");
      }

      // Send video directly
      await sock.sendMessage(
        chatId,
        {
          video: videoBuffer,
          caption: "📹 Instagram Video",
          mimetype: "video/mp4"
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error("[IG ERROR]", err);
      await sock.sendMessage(
        chatId,
        { text: "❌ Failed to download. Try another link." },
        { quoted: msg }
      );
    }
  }
};
