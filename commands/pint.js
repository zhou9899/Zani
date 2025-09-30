import { pinterest } from 'ironman-api';

export default {
  name: 'pint',
  category: 'search',
  description: 'Search Pinterest images using ironman-api',
  
  async execute(m, { conn, text }) {
    // Safety checks
    if (!m) return console.error('Message object "m" is undefined');
    if (!conn) return console.error('Connection object "conn" is undefined');

    try {
      if (!text) {
        return await conn.sendMessage(
          m.chat,
          { text: '❌ Please provide a search query!\nExample: .pint wedding decorations' },
          { quoted: m }
        );
      }

      await conn.sendMessage(m.chat, { text: '⏳ Searching Pinterest...' }, { quoted: m });

      const results = await pinterest(text);

      if (!results || results.length === 0) {
        return await conn.sendMessage(
          m.chat,
          { text: `❌ No Pinterest results found for "${text}"` },
          { quoted: m }
        );
      }

      const pinsToSend = results.slice(0, 5);

      for (let i = 0; i < pinsToSend.length; i++) {
        const pin = pinsToSend[i];
        const caption = `*${i + 1}. ${pin.title || 'Pinterest Pin'}*\n🔗 ${pin.url || pin.link || 'Link not available'}`;

        try {
          if (pin.image || pin.img) {
            await conn.sendMessage(
              m.chat,
              { image: { url: pin.image || pin.img }, caption },
              { quoted: m }
            );
          } else {
            // If image is missing, send as text
            await conn.sendMessage(
              m.chat,
              { text: caption },
              { quoted: m }
            );
          }

          // Delay to avoid rate-limiting
          if (i < pinsToSend.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (err) {
          console.error(`Error sending pin ${i + 1}:`, err);
          await conn.sendMessage(
            m.chat,
            { text: `*${i + 1}. ${pin.title || 'Pinterest Pin'}*\n🔗 ${pin.url || pin.link || 'Link not available'}` },
            { quoted: m }
          );
        }
      }

      await conn.sendMessage(
        m.chat,
        { text: `✅ Found ${results.length} Pinterest results for "${text}"` },
        { quoted: m }
      );

    } catch (error) {
      console.error('Pinterest command error:', error);
      if (conn && m.chat) {
        await conn.sendMessage(
          m.chat,
          { text: '❌ Error searching Pinterest. Please try again later.' },
          { quoted: m }
        );
      }
    }
  }
};	
