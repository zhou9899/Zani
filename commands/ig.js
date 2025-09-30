// commands/ig.js
import { spawn } from "child_process";

async function downloadToBuffer(url, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      "-f", "best[ext=mp4]/best",
      "-o", "-",
      "--quiet",
      "--no-warnings",
      "--no-part",
      url
    ]);

    const chunks = [];
    let timer = setTimeout(() => {
      ytdlp.kill("SIGKILL");
      reject(new Error("yt-dlp timeout"));
    }, timeout);

    ytdlp.stdout.on("data", (chunk) => chunks.push(chunk));

    ytdlp.stderr.on("data", (d) => {
      const msg = d.toString().trim();
      if (msg) console.error("yt-dlp error:", msg);
    });

    ytdlp.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`yt-dlp failed with code ${code}`));
    });

    ytdlp.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export default {
  name: "ig",
  description: "Download Instagram reels/posts/stories and send to WhatsApp",
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
      await sock.sendMessage(
        chatId,
        { text: "⏳ Downloading Instagram video..." },
        { quoted: msg }
      );

      const videoBuffer = await downloadToBuffer(instagramUrl);

      if (!videoBuffer || videoBuffer.length === 0) {
        throw new Error("Empty video buffer");
      }

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
