import axios from "axios";

// ✅ create axios instance with no proxy
const cleanAxios = axios.create({ proxy: false, timeout: 20000, headers: { "User-Agent": "Mozilla/5.0" } });

async function fetchFromKonachan() {
  const url = "https://konachan.com/post.json?tags=yuri+rating:explicit&limit=20";
  try {
    const { data } = await cleanAxios.get(url);
    if (Array.isArray(data) && data.length > 0) {
      return data[Math.floor(Math.random() * data.length)];
    }
  } catch (err) {
    console.error("Konachan fetch failed:", err.message);
  }
  return null;
}

async function fetchFromGelbooru() {
  const url = "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=yuri+rating:explicit&limit=20";
  try {
    const { data } = await cleanAxios.get(url);
    if (Array.isArray(data) && data.length > 0) {
      return data[Math.floor(Math.random() * data.length)];
    }
  } catch (err) {
    console.error("Gelbooru fetch failed:", err.message);
  }
  return null;
}

async function fetchFromSafebooru() {
  const url = "https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=yuri&limit=20";
  try {
    const { data } = await cleanAxios.get(url);
    if (Array.isArray(data) && data.length > 0) {
      return data[Math.floor(Math.random() * data.length)];
    }
  } catch (err) {
    console.error("Safebooru fetch failed:", err.message);
  }
  return null;
}

export default {
  name: "yuri",
  description: "Fetches a random high-quality Yuri image from multiple sources",
  nsfw: true,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    await sock.sendMessage(chatId, { text: "🌐 Searching NSFW Yuri images..." }, { quoted: msg });

    let image = await fetchFromKonachan();
    if (!image) image = await fetchFromGelbooru();
    if (!image) image = await fetchFromSafebooru();

    if (!image) {
      return sock.sendMessage(chatId, { text: "❌ No Yuri images found." }, { quoted: msg });
    }

    const imageUrl = image.file_url || image.source || image.sample_url;
    await sock.sendMessage(chatId, {
      image: { url: imageUrl },
      caption: `🎨 Yuri Image`
    }, { quoted: msg });
  }
};
