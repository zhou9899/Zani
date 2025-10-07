// commands/cosplay.js
import axios from 'axios';

export default {
  name: 'cosplay',
  description: 'Sends a random cosplay/waifu image',
  async execute(sock, msg, args) {
    try {
      // Using a valid SFW endpoint
      const url = 'https://api.waifu.pics/sfw/waifu';
      const response = await axios.get(url);
      const imageUrl = response.data.url;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: imageUrl },
        caption: '✨ Here is your cosplay/waifu image!'
      }, { quoted: msg });

    } catch (error) {
      console.error('Error fetching cosplay image:', error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to fetch an image. Try again later.'
      }, { quoted: msg });
    }
  }
};
