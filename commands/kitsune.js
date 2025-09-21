// commands/kitsune.js
import axios from "axios";

export default {
  name: "kitsune",
  description: "Sends a high-quality kitsune image",
  async execute(sock, msg, args) {
    try {
      const res = await axios.get("https://nekos.best/api/v2/kitsune");
      const imageUrl = res.data.results[0].url;

      await sock.sendMessage(
        msg.key.remoteJid,
        { image: { url: imageUrl }, caption: "🦊 Kitsune" },
        { quoted: msg }
      );
    } catch (err) {
      console.error("Error fetching kitsune:", err.message);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to fetch kitsune image." },
        { quoted: msg }
      );
    }
  },
};
