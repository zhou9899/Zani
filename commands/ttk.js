// commands/ttk.js
import fetch from "node-fetch";

export default {
  name: "ttk",
  description: "Download TikTok videos (via Tikcdn)",
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Please provide a TikTok link" },
        { quoted: msg }
      );
    }

    const tiktokUrl = args[0];
    const api = `https://ironman.koyeb.app/ironman/dl/v4/tiktok?url=${encodeURIComponent(tiktokUrl)}`;

    try {
      // Call API
      const res = await fetch(api);
      const data = await res.json();

      if (!data.url) {
        throw new Error("No video URL in API response");
      }

      // Download TikTok video (new way, no warnings)
      const videoRes = await fetch(data.url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const arrayBuffer = await videoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Send to WhatsApp
      await sock.sendMessage(
        chatId,
        {
          video: buffer,
          caption: `🎬 ${data.title || "TikTok Video"}`
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("[TTK ERROR]", err);
      await sock.sendMessage(
        chatId,
        { text: "⚠️ Failed to fetch video." },
        { quoted: msg }
      );
    }
  }
};
