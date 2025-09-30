// commands/yt.js
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";

const execPromise = util.promisify(exec);

export default {
  name: "yt",
  description: "Download YouTube video (URL only)",

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    if (!args[0]) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Provide a YouTube video URL.\n\nExample: .yt https://youtube.com/watch?v=dQw4w9WgXcQ" },
        { quoted: msg }
      );
    }

    const url = args[0];
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `yt-${Date.now()}.mp4`);

    try {
      await sock.sendMessage(chatId, { text: "⬇️ Downloading video..." }, { quoted: msg });

      // ✅ Always get best MP4 with audio (no merging step)
      const cmd = `yt-dlp -f "best[ext=mp4][vcodec!=none][acodec!=none]" -o "${tempFile}" "${url}"`;
      await execPromise(cmd);

      if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
        throw new Error("Downloaded file missing/empty");
      }

      await sock.sendMessage(
        chatId,
        {
          video: fs.readFileSync(tempFile),
          caption: "✅ Here's your video",
          mimetype: "video/mp4",
        },
        { quoted: msg }
      );

      fs.unlinkSync(tempFile);
    } catch (err) {
      console.error("❌ Error in .yt command:", err);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

      await sock.sendMessage(
        chatId,
        { text: "❌ Failed to download video.\n\nError: " + err.message },
        { quoted: msg }
      );
    }
  },
};
