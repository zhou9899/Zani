import axios from 'axios';
import cheerio from 'cheerio';

const CATEGORY = 'pin';
const userCooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5 seconds

export default {
    name: CATEGORY,
    description: 'Fetch Pinterest images by query',
    async execute(sock, msg, args) {
        const sender = msg.key.participant || msg.key.remoteJid;
        const now = Date.now();
        const lastUsed = userCooldowns.get(sender) || 0;

        if (now - lastUsed < COOLDOWN_TIME) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: `⏳ Please wait ${Math.ceil((COOLDOWN_TIME - (now - lastUsed)) / 1000)}s before using this command again.` },
                { quoted: msg }
            );
        }
        userCooldowns.set(sender, now);

        const query = args.join(' ');
        if (!query) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Please provide a search query.' }, { quoted: msg });

        try {
            // Fetch Pinterest search page
            const res = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(res.data);
            const results = [];

            // Extract images
            $('img[src]').each((i, el) => {
                if (i >= 5) return false; // limit results
                const image = $(el).attr('src');
                const title = $(el).attr('alt') || 'No title';
                const link = $(el).parent('a').attr('href') || '';
                results.push({ image, title, link });
            });

            if (results.length === 0) {
                return sock.sendMessage(msg.key.remoteJid, { text: `❌ No Pinterest results found for "${query}".` }, { quoted: msg });
            }

            // Send images to WhatsApp
            for (const pin of results) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: pin.image },
                    caption: `${pin.title}\n${pin.link}`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Pinterest search error:', error.message);
            sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch Pinterest images.' }, { quoted: msg });
        }
    }
};
