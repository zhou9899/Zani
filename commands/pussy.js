import NSFW from "discord-nsfw";

const nsfw = new NSFW();

export default {
  name: "pussy",
  description: "Fetches a pussy NSFW image",
  nsfw: true,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    try {
      const image = await nsfw.pussy(); // discord-nsfw function for this category
      await sock.sendMessage(chatId, {
        image: { url: image },
        caption: "🔥 Here's some pussy content!"
      }, { quoted: msg });
    } catch (err) {
      console.error(`❌ Error fetching pussy image:`, err);
      await sock.sendMessage(chatId, { text: "❌ Failed to fetch pussy image." }, { quoted: msg });
    }
  }
};
