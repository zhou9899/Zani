// commands/nsfw.js
import axios from "axios";

export default {
  name: "nsfw",
  description: "Fetch NSFW images (waifu/trap/neko/blowjob)",
  adminOnly: true, // ensures messageHandler enforces admin/mod/owner
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a category (waifu/trap/neko/blowjob)" });
      return;
    }

    const category = args[0].toLowerCase();
    if (!["waifu", "trap", "neko", "blowjob"].includes(category)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Invalid NSFW category.\n✅ Available: waifu, trap, neko, blowjob"
      });
      return;
    }

    try {
      const res = await axios.get(`https://api.waifu.pics/nsfw/${category}`);
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: res.data.url },
        caption: `🔞 NSFW ${category}`
      });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Failed to fetch from API." });
    }
  },
};
