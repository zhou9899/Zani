// commands/translate.js
import axios from 'axios';

export default {
  name: 'tt',
  description: 'Translate replied message to specified language',
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    try {
      // Check if the user replied to a message
      if (!msg.message.extendedTextMessage || !msg.message.extendedTextMessage.contextInfo?.quotedMessage) {
        return await sock.sendMessage(chatId, { text: "⚠️ Please reply to a message to translate it." }, { quoted: msg });
      }

      // Extract text from the replied message
      const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      let textToTranslate = '';

      if (quotedMsg.conversation) {
        textToTranslate = quotedMsg.conversation;
      } else if (quotedMsg.extendedTextMessage?.text) {
        textToTranslate = quotedMsg.extendedTextMessage.text;
      } else {
        return await sock.sendMessage(chatId, { text: "❌ Cannot translate this type of message." }, { quoted: msg });
      }

      // Check if target language is provided
      const targetLang = args[0];
      if (!targetLang) {
        return await sock.sendMessage(chatId, { text: "⚠️ Please provide the target language code. Example: .tt en" }, { quoted: msg });
      }

      // Call your deployed translation API
      const response = await axios.get('https://ironman.koyeb.app/translate', {
        params: {
          text: textToTranslate,
          lang: targetLang
        }
      });

      const translatedText = response.data?.result?.text;
      if (!translatedText) {
        return await sock.sendMessage(chatId, { text: "❌ Failed to translate the message." }, { quoted: msg });
      }

      // Send translated text
      await sock.sendMessage(chatId, { text: `🌐 Translated (${targetLang}):\n${translatedText}` }, { quoted: msg });

    } catch (err) {
      console.error('Error in translate command:', err);
      await sock.sendMessage(chatId, { text: '❌ Error while translating message.' }, { quoted: msg });
    }
  }
};
