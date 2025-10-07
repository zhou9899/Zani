// commands/toimg.js
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export const name = "toimg";
export const description = "Convert replied sticker/view-once message to image";
export const adminOnly = false;

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;

  try {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
      return sock.sendMessage(jid, {
        text: "❌ Please reply to a sticker or view-once message to convert it to image."
      }, { quoted: msg });
    }

    let targetMessage = null;

    if (quotedMsg.stickerMessage) targetMessage = { message: { stickerMessage: quotedMsg.stickerMessage } };
    else if (quotedMsg.viewOnceMessageV2?.message?.imageMessage) targetMessage = { message: { imageMessage: quotedMsg.viewOnceMessageV2.message.imageMessage } };
    else if (quotedMsg.viewOnceMessageV2?.message?.videoMessage) targetMessage = { message: { videoMessage: quotedMsg.viewOnceMessageV2.message.videoMessage } };
    else if (quotedMsg.imageMessage) targetMessage = { message: { imageMessage: quotedMsg.imageMessage } };

    if (!targetMessage) {
      return sock.sendMessage(jid, {
        text: "❌ Replied message is not a sticker or view-once message that can be converted."
      }, { quoted: msg });
    }

    // Download actual media
    const buffer = await downloadMediaMessage(targetMessage, "buffer", {});

    await sock.sendMessage(jid, {
      image: buffer,
      caption: "🖼️ Converted successfully"
    }, { quoted: msg });

  } catch (err) {
    console.error("TOIMG ERROR:", err);
    return sock.sendMessage(jid, {
      text: "❌ Failed to convert to image. Make sure you're replying to a valid sticker or view-once message."
    }, { quoted: msg });
  }
}
