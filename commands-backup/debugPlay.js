import fs from "fs";
import path from "path";
import * as Jimp from "jimp";
import play from "play-dl";
import ytdl from "@distube/ytdl-core";
import ytSearch from "yt-search";

export const name = "debugPlay";
export const description = "Debug wrapper for .play and .yt commands";

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  try {
    console.log("Args received:", args);

    if (!args.length) return sock.sendMessage(jid, { text: "❌ No query provided" }, { quoted: msg });

    let url = args[0];

    // If it's not a URL, search YouTube
    if (!play.yt_validate(url) && !ytdl.validateURL(url)) {
      console.log("Query detected, performing search...");
      const searchResults = await ytSearch(args.join(" "));
      if (!searchResults?.videos?.length) {
        return sock.sendMessage(jid, { text: "❌ No results found." }, { quoted: msg });
      }
      url = searchResults.videos[0].url;
      console.log("Search result URL:", url);
    }

    if (play.yt_validate(url)) {
      console.log("✅ play-dl URL validated");
      const info = await play.video_info(url);
      console.log("Video info received:", info.video_details.title);
      await sock.sendMessage(jid, { text: `✅ Video info fetched: ${info.video_details.title}` }, { quoted: msg });
    } else if (ytdl.validateURL(url)) {
      console.log("✅ ytdl-core URL validated");
      const info = await ytdl.getInfo(url);
      console.log("Video title:", info.videoDetails.title);
      await sock.sendMessage(jid, { text: `✅ ytdl-core info fetched: ${info.videoDetails.title}` }, { quoted: msg });
    } else {
      console.log("❌ Invalid URL after search");
      await sock.sendMessage(jid, { text: "❌ Invalid URL or search query" }, { quoted: msg });
    }

  } catch (err) {
    console.error("🔥 DebugPlay error:", err);
    await sock.sendMessage(jid, { text: `❌ Debug error: ${err.message}` }, { quoted: msg });
  }
}
