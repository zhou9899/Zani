// commands/hentai.js
import NSFW from "discord-nsfw";

const nsfw = new NSFW();

export default {
  name: "hentai",
  description: "Fetches a random hentai image",
  adminOnly: true, // restricts to Owners/Mods/Admins
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    try {
      // Fetch hentai image
      const imageUrl = await nsfw.hentai();

      if (!imageUrl) {
        return await sock.sendMessage(
          chatId,
          { text: "❌ Failed to fetch hentai image." },
          { quoted: msg }
        );
      }

      // Send image
      await sock.sendMessage(
        chatId,
        {
          image: { url: imageUrl },
          caption: "🔥 Here's a hentai image!"
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Error fetching hentai image:", err);
      await sock.sendMessage(chatId, { text: "❌ Error fetching hentai image." }, { quoted: msg });
    }
  }
};
