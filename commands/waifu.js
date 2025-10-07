import axios from 'axios';

const CATEGORY = 'waifu';
const URL = 'https://api.waifu.pics/sfw/waifu';
const userCooldowns = new Map();
const COOLDOWN_TIME = 3000; // 3 seconds

async function fetchImage(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.data?.url || null;
  } catch (err) {
    console.error('Error fetching image:', err.message);
    return null;
  }
}

export default {
  name: CATEGORY,
  description: 'Sends a waifu image',
  async execute(sock, msg, args) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const now = Date.now();
    const lastUsed = userCooldowns.get(sender) || 0;
    if (now - lastUsed < COOLDOWN_TIME) {
      return sock.sendMessage(msg.key.remoteJid, { text: `⏳ Please wait ${Math.ceil((COOLDOWN_TIME - (now - lastUsed)) / 1000)}s before using this command again.` }, { quoted: msg });
    }
    userCooldowns.set(sender, now);

    const imageUrl = await fetchImage(URL);
    if (!imageUrl) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch image.' }, { quoted: msg });

    await sock.sendMessage(msg.key.remoteJid, { image: { url: imageUrl } }, { quoted: msg });
  }
};
