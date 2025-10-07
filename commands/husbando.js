// commands/husbando.js
import axios from "axios";

export default {
  name: "husbando",
  description: "Sends a high-quality husbando image",
  async execute(sock, msg, args) {
    try {
      const res = await axios.get("https://nekos.best/api/v2/husbando");
      const imageUrl = res.data.results[0].url;

      await sock.sendMessage(
        msg.key.remoteJid,
        { image: { url: imageUrl }, caption: "👨 Husbando" },
        { quoted: msg }
      );
    } catch (err) {
      console.error("Error fetching husbando:", err.message);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to fetch husbando image." },
        { quoted: msg }
      );
    }
  },
};
