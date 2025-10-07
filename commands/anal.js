import NSFW from "discord-nsfw";

const nsfw = new NSFW();

export default {
  name: "anal",
  description: "Fetches an anal NSFW image",
  nsfw: true,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    try {
      const image = await nsfw.anal();
      await sock.sendMessage(chatId, {
        image: { url: image },
        caption: "🔥 Here's some anal content!"
      }, { quoted: msg });
    } catch (err) {
      console.error("❌ Error fetching anal image:", err);
      await sock.sendMessage(chatId, { text: "❌ Failed to fetch anal image." }, { quoted: msg });
    }
  }
};
