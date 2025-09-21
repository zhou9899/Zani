import axios from "axios";

const categories = [
  "nsfw-gasm",
  "nsfw-neko",
  "nsfw-waifu",
  "nsfw-trap",
  "nsfw-blowjob"
];

async function test() {
  for (const cat of categories) {
    try {
      const res = await axios.get(`https://nekos.fun/api/v2/${cat}`, { timeout: 10000 });
      console.log(`[OK] ${cat}:`, res.data);
    } catch (err) {
      console.error(`[FAIL] ${cat}:`, err.message);
    }
  }
}

test();
