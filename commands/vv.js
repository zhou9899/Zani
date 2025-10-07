import fs from "fs";
import path from "path";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "vv",
  description: "View a 'view once' media again",
  ownerOnly: false,
  adminOnly: false,

  async execute(sock, msg, args) {
    try {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Reply to a view-once message with .vv" },
          { quoted: msg }
        );
      }

      // Handle view-once unwrap
      let mediaMessage = null;
      if (quoted.viewOnceMessage) {
        mediaMessage = quoted.viewOnceMessage.message;
      } else {
        mediaMessage = quoted;
      }

      const type = Object.keys(mediaMessage)[0];
      if (!["imageMessage", "videoMessage"].includes(type)) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Not a view-once image/video" },
          { quoted: msg }
        );
      }

      // Download full message
      const buffer = await downloadMediaMessage(
        { message: mediaMessage },
        "buffer",
        {},
        { messageType: type }
      );

      const fileName = `${Date.now()}.${type === "imageMessage" ? "jpg" : "mp4"}`;
      const filePath = path.join(process.cwd(), "downloads", fileName);

      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          [type === "imageMessage" ? "image" : "video"]: { url: filePath },
          caption: "👀 View once media",
        },
        { quoted: msg }
      );

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ Error in .vv command:", err);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to view media." },
        { quoted: msg }
      );
    }
  },
};
