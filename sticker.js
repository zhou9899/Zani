import fs from "fs";
import { exec } from "child_process";

export const name = "sticker";
export const description = "Convert an image or short video to sticker";

// ✨ Custom metadata in cursive
const stickerPack = "𝓩𝓪𝓷𝓲 𝓟𝓪𝓬𝓴";
const stickerAuthor = "𝒵𝒶𝓃𝒾";

export async function execute(sock, msg) {
  const jid = msg.key.remoteJid;
  const m = msg.message?.imageMessage || msg.message?.videoMessage;

  if (!m) {
    await sock.sendMessage(jid, { text: "❌ Send an image or short video with the caption *!sticker*" });
    return;
  }

  const buffer = await sock.downloadMediaMessage(msg);
  const inputPath = "./temp_input";
  const outputPath = "./temp.webp";

  fs.writeFileSync(inputPath, buffer);

  // ffmpeg convert to webp sticker with metadata
  const cmd = `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white" -loop 0 -ss 0 -t 8 -an -vsync 0 -y ${outputPath}`;
  exec(cmd, async (err) => {
    if (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "❌ Failed to make sticker" });
    } else {
      const sticker = fs.readFileSync(outputPath);

      await sock.sendMessage(jid, {
        sticker,
        packname: stickerPack, // 👈 pack name
        author: stickerAuthor, // 👈 cursive author
      });
    }

    // cleanup
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  });
}

