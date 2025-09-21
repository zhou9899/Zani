import NSFW from '@jcauman23/discordnsfw';

const nsfw = new NSFW();

export default {
  name: 'milf',
  description: 'Fetches a MILF hentai image',
  nsfw: true,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    try {
      const imageUrl = await nsfw.anime.milf();
      await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: '🔥 MILF hentai image'
      }, { quoted: msg });
    } catch (err) {
      console.error('❌ Error fetching MILF hentai:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to fetch MILF hentai.' }, { quoted: msg });
    }
  }
};
