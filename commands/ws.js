import axios from 'axios';

const CATEGORY = 'ws';
const userCooldowns = new Map();
const COOLDOWN_TIME = 3000; // 3 seconds

async function fetchWaifu() {
    try {
        const res = await axios.get('https://ironman.koyeb.app/ironman/waifu', { timeout: 10000 });
        if (res.data?.ironman?.url) {
            return res.data.ironman.url;
        }
        return null;
    } catch (err) {
        console.error('Ironman API failed:', err.message);
        return null;
    }
}

export default {
    name: CATEGORY,
    description: 'Sends a random waifu from Ironman API',
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

        const imageUrl = await fetchWaifu();

        if (!imageUrl) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch waifu.' }, { quoted: msg });
        }

        const caption = '💖 Random Waifu';

        await sock.sendMessage(
            msg.key.remoteJid,
            { image: { url: imageUrl }, caption },
            { quoted: msg }
        );
    }
};
