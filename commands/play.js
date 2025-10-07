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

      // check if input is a YouTube link
      if (query.includes("youtube.com") || query.includes("youtu.be")) {
        ytInfo = await play.video_basic_info(query);
      } else {
        // search on YouTube
        const results = await play.search(query, { limit: 1 });
        if (!results.length) {
          return sock.sendMessage(chatId, { text: "❌ No results found." }, { quoted: msg });
        }
        ytInfo = await play.video_basic_info(results[0].url);
      }

      const title = ytInfo.video_details.title;
      const videoUrl = ytInfo.video_details.url;

      // highest quality thumbnail
      const thumbs = ytInfo.video_details.thumbnails;
      const thumbnail = thumbs?.[thumbs.length - 1]?.url || null;

      // send thumbnail + video title
      if (thumbnail) {
        const thumbBuffer = Buffer.from(await (await fetch(thumbnail)).arrayBuffer());
        await sock.sendMessage(
          chatId,
          {
            image: thumbBuffer,
            caption: `🎶 *${title}*\n\n⬇️ Downloading audio...`
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          chatId,
          { text: `🎶 *${title}*\n\n⬇️ Downloading audio...` },
          { quoted: msg }
        );
      }

      // prepare output file
      const outputFile = `/data/data/com.termux/files/home/Zani/temp/${Date.now()}.mp3`;

      // detect best audio format that actually exists
      const listFormatsCmd = `yt-dlp -F "${videoUrl}"`;
      const { stdout: formatsStdout } = await execPromise(listFormatsCmd);

      // find the first audio-only format
      const audioFormatLine = formatsStdout
        .split("\n")
        .find(line => /audio only/i.test(line) || line.match(/m4a|webm|mp4/i));
      
      let formatCode = "bestaudio[ext=m4a]"; // fallback
      if (audioFormatLine) {
        const match = audioFormatLine.trim().split(/\s+/)[0];
        if (match) formatCode = match;
      }

      // download audio using the selected format
      const cmd = `yt-dlp -f ${formatCode} -x --audio-format mp3 --audio-quality 0 -o "${outputFile}" "${videoUrl}"`;
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
