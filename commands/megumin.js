import axios from 'axios';

const URL = 'https://api.waifu.pics/sfw/megumin';
const userCooldowns = new Map();
const COOLDOWN = 3000; // 3 seconds

export default {
  name: 'megumin',
  description: 'Sends a Megumin image',
  async execute(sock, msg, args) {
    const sender = msg.key.participant || msg.key.remoteJid;
    if (userCooldowns.has(sender) && Date.now() - userCooldowns.get(sender) < COOLDOWN) return;
    userCooldowns.set(sender, Date.now());

    try {
      const res = await axios.get(URL);
      const imageUrl = res.data.url;
      if (!imageUrl) throw new Error('No image found');

      await sock.sendMessage(msg.key.remoteJid, { image: { url: imageUrl }, caption: 'Here is a Megumin!' }, { quoted: msg });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch image' }, { quoted: msg });
    }
  }
};
