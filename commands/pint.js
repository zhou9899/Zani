import axios from 'axios';
import 'dotenv/config';

export const name = "pint";
export const description = "Search Pinterest and send real images as WhatsApp album";
export const usage = ".pint <search query> | .pint pizza 5";

export async function execute(sock, msg, args) {
  try {
    const chatId = msg.key?.remoteJid;
    if (!chatId) throw new Error("Cannot find chat ID");

    let query = args.join(' ') || "cat";
    let count = 4;

    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg) && lastArg > 0 && lastArg <= 8) {
      count = parseInt(lastArg);
      query = args.slice(0, -1).join(' ') || "cat";
    }

    await sock.sendMessage(chatId, { text: `🔍 Searching Pinterest for "${query}"...⏳` }, { quoted: msg });

    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

    // Fetch rendered HTML via ScrapingBee
    const res = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: process.env.SCRAPINGBEE_KEY,
        url: pinterestUrl,
        render_js: true
      },
      timeout: 20000
    });

    const html = res.data;

    // Extract ONLY real Pinterest pins (original images)
    const matches = [...html.matchAll(/"url":"(https:\/\/i.pinimg.com\/originals[^"]+)"/g)];
    let urls = matches.map(m => m[1].replace(/\\/g, '')); // remove escape slashes
    urls = [...new Set(urls)].slice(0, count); // unique & limit

    if (urls.length === 0) {
      return await sock.sendMessage(chatId, { text: `❌ No Pinterest images found for "${query}"` }, { quoted: msg });
    }

    // Send images as album without captions
    for (let i = 0; i < urls.length; i++) {
      const imgRes = await axios.get(urls[i], { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imgRes.data, 'binary');
      await sock.sendMessage(chatId, { image: buffer });
      await new Promise(r => setTimeout(r, 1000));
    }

    await sock.sendMessage(chatId, { text: `✅ Sent ${urls.length} Pinterest images for "${query}"` }, { quoted: msg });

  } catch (error) {
    console.error("Pint command error:", error.message);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Pinterest Search Failed!\n${error.message}` }, { quoted: msg });
  }
}
