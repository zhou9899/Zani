// commands/play.js
import fs from "fs";
import fetch from "node-fetch";
import { exec } from "child_process";
import util from "util";
import play from "play-dl";

const execPromise = util.promisify(exec);

export default {
  name: "play",
  description: "Play music from YouTube",
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    if (!args[0]) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Provide a song name or YouTube link\n\nExample: .play never gonna give you up" },
        { quoted: msg }
      );
    }

    try {
      const query = args.join(" ");
      let ytInfo;

      // if input is a link
      if (query.includes("youtube.com") || query.includes("youtu.be")) {
        ytInfo = await play.video_basic_info(query);
      } else {
        // search YouTube
        const results = await play.search(query, { limit: 1 });
        if (!results.length) {
          return sock.sendMessage(chatId, { text: "❌ No results found." }, { quoted: msg });
        }
        ytInfo = await play.video_basic_info(results[0].url);
      }

      const title = ytInfo.video_details.title;
      const duration = ytInfo.video_details.durationRaw || "Unknown";
      const videoUrl = ytInfo.video_details.url;
      const thumbnail = ytInfo.video_details.thumbnails?.[0]?.url || null;

      // send thumbnail + info first
      if (thumbnail) {
        const thumbBuffer = Buffer.from(await (await fetch(thumbnail)).arrayBuffer());
        await sock.sendMessage(
          chatId,
          {
            image: thumbBuffer,
            caption: `🎶 *${title}*\n⏱️ Duration: ${duration}\n\n⬇️ Downloading audio...`
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          chatId,
          { text: `🎶 *${title}*\n⏱️ Duration: ${duration}\n\n⬇️ Downloading audio...` },
          { quoted: msg }
        );
      }

      // download audio with yt-dlp
      const outputFile = `/data/data/com.termux/files/home/Zani/temp/${Date.now()}.mp3`;
      const cmd = `yt-dlp -f 140 -x --audio-format mp3 --audio-quality 0 -o "${outputFile}" "${videoUrl}"`;
      await execPromise(cmd);

      // send audio
      await sock.sendMessage(
        chatId,
        {
          audio: fs.readFileSync(outputFile),
          mimetype: "audio/mp4",
          fileName: `${title}.mp3`
        },
        { quoted: msg }
      );

      fs.unlinkSync(outputFile); // cleanup

    } catch (err) {
      console.error("[PLAY ERROR]", err);
      await sock.sendMessage(chatId, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
    }
  }
};
