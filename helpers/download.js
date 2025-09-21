// helpers/download.js
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

/**
 * Returns a Buffer from any media message (image, video, sticker, GIF)
 */
export async function getMediaBuffer(message) {
    if (!message) return null;

    const type = Object.keys(message)[0]; // imageMessage, videoMessage, stickerMessage, etc.
    if (!type) return null;

    const stream = await downloadContentFromMessage(message, type.replace("Message", ""));
    let buffer = Buffer.alloc(0);

    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    return buffer;
}

