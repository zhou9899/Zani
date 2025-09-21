#!/bin/bash
# Patch Zhou WhatsApp bot play.js command

PLAY_FILE="./commands/play.js"

cat > "$PLAY_FILE" << 'EOF'
// commands/play.js
import pkg from "ytdl-core"; // import entire CJS module
const { getInfo, validateURL } = pkg;

import ytSearch from "yt-search";
import * as Jimp from "jimp";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export const name = "play";
export const description = "Download YouTube audio and send to WhatsApp with thumbnail";

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const requester = msg.key.participant || jid;

  if (!args.length) return sock.sendMessage(jid, { text: "❌ Provide a search query or YouTube URL." }, { quoted: msg });

  try {
    let url = args[0];
    if (!validateURL(url)) {
      const searchResults = await ytSearch(args.join(" "));
      if (!searchResults?.videos?.length) return sock.sendMessage(jid, { text: "❌ No results found." }, { quoted: msg });
      url = searchResults.videos[0].url;
    }

    const info = await getInfo(url);
    const title = info.videoDetails.title;
    const thumbURL = info.videoDetails.thumbnails.slice(-1)[0].url;

    // Send thumbnail immediately
    const thumbBuffer = Buffer.from(await (await fetch(thumbURL)).arrayBuffer());
    const image = await Jimp.read(thumbBuffer);
    const thumbnail = await image.resize(400, Jimp.AUTO).getBufferAsync(Jimp.MIME_JPEG);

    await sock.sendMessage(jid, {
      image: thumbnail,
      caption: `🎵 Downloading audio: ${title}`,
    }, { quoted: msg, mentions: [requester] });

    // Download audio
    const tempDir = "/data/data/com.termux/files/home/bot/temp";
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const audioPath = path.join(tempDir, `${title}.mp3`);

    await new Promise((resolve, reject) => {
      const stream = pkg(url, { filter: "audioonly", quality: "highestaudio" });
      const fileStream = fs.createWriteStream(audioPath);
      stream.pipe(fileStream);
      stream.on("error", reject);
      fileStream.on("finish", resolve);
    });

    // Send audio with thumbnail
    await sock.sendMessage(jid, {
      audio: fs.readFileSync(audioPath),
      mimetype: "audio/mp4",
      fileName: `${title}.mp3`,
      ptt: false,
      contextInfo: { externalAdReply: { title, body: "", mediaType: 2, thumbnail } }
    }, { quoted: msg, mentions: [requester] });

    fs.unlinkSync(audioPath);

  } catch (err) {
    console.error("❌ Play command error:", err);
    await sock.sendMessage(jid, { text: "❌ Failed to fetch or send audio." }, { quoted: msg });
  }
}
EOF

echo "✅ play.js patched successfully!"
