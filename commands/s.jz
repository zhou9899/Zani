// commands/s.js
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { writeExif } from "../helpers/stickerExif.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export const name = "s";
export const description = "Convert image/video/sticker into WhatsApp-friendly sticker";
export const aliases = ["sticker", "stick"];

// WhatsApp's recommended sticker dimensions
const MAX_STICKER_SIZE = 512;
const TARGET_FPS = 30;
const MAX_DURATION = 7; // seconds

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  // Get the target message (quoted or current)
  let targetMessage = msg;
  if (quoted) {
    targetMessage = {
      key: {
        remoteJid: jid,
        id: msg.message.extendedTextMessage.contextInfo.stanzaId
      },
      message: quoted
    };
  }

  // Check if target message has media
  const hasMedia =
    targetMessage.message?.imageMessage ||
    targetMessage.message?.videoMessage ||
    targetMessage.message?.stickerMessage;

  if (!hasMedia) {
    await sock.sendMessage(
      jid,
      { text: "❌ Please reply to an image, video, or sticker with `.s`" },
      { quoted: msg }
    );
    return;
  }

  // Declare variables outside try block
  let inputPath = null;
  let outPath = null;

  try {
    // Download media
    const buffer = await downloadMediaMessage(
      targetMessage,
      'buffer',
      {},
      { logger: console, reuploadRequest: sock.updateMediaMessage }
    );

    inputPath = path.join(tmpdir(), `sticker_in_${Date.now()}.dat`);
    await writeFile(inputPath, buffer);
    outPath = path.join(tmpdir(), `sticker_out_${Date.now()}.webp`);

    const isSticker = targetMessage.message?.stickerMessage;
    const isAnimated = isSticker && targetMessage.message.stickerMessage.isAnimated;
    const isVideo = targetMessage.message?.videoMessage;
    
    // Get mimetype for better processing
    const mimetype = targetMessage.message?.videoMessage?.mimetype ||
                    targetMessage.message?.imageMessage?.mimetype ||
                    targetMessage.message?.stickerMessage?.mimetype || '';
    
    const isGif = mimetype.includes('gif');

    // If it's already a sticker, just add metadata and resend
    if (isSticker) {
      console.log("🔄 Processing existing sticker...");
      await writeFile(outPath, buffer);
      await writeExif(outPath, "𝒵𝒶𝓃𝒾'𝓈 𝒮𝓉𝒾𝒸𝓀𝑒𝓇𝓈", "𝒵𝒶𝓃𝒾'𝓈 𝐵𝑜𝓉");
      
      await sock.sendMessage(
        jid,
        { sticker: { url: outPath } },
        { quoted: msg }
      );
      return;
    }

    // Convert to sticker (image/video/GIF → webp)
    console.log(`🔄 Converting ${isVideo || isGif ? 'video/GIF' : 'image'} to sticker...`);
    
    await new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);
      
      // Configure based on media type
      if (isVideo || isGif) {
        // For animated content
        command
          .outputOptions([
            "-vcodec", "libwebp",
            // Smart scaling to fit WhatsApp's dimensions while maintaining aspect ratio
            "-vf", `scale=w=${MAX_STICKER_SIZE}:h=${MAX_STICKER_SIZE}:force_original_aspect_ratio=decrease:flags=lanczos,format=rgba`,
            "-loop", "0",
            "-t", MAX_DURATION.toString(), // Limit duration
            "-r", TARGET_FPS.toString(), // Set frame rate
            "-preset", "default",
            "-an", // Remove audio
            "-vsync", "2", // Video sync method
            "-compression_level", "6",
            "-qscale", "75",
            "-quality", "80"
          ]);
      } else {
        // For static images
        command
          .outputOptions([
            "-vcodec", "libwebp",
            // Smart scaling without unnecessary padding
            "-vf", `scale=w=${MAX_STICKER_SIZE}:h=${MAX_STICKER_SIZE}:force_original_aspect_ratio=decrease:flags=lanczos,format=rgba`,
            "-preset", "picture", // Better quality for images
            "-compression_level", "6",
            "-qscale", "90", // Higher quality for static images
            "-quality", "90"
          ]);
      }
      
      command
        .on("start", (cmdline) => {
          console.log("FFmpeg command:", cmdline);
        })
        .save(outPath)
        .on("end", () => {
          console.log("✅ FFmpeg conversion completed successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          reject(err);
        });
    });

    // Add WhatsApp EXIF metadata
    await writeExif(outPath, "𝒵𝒶𝓃𝒾'𝓈 𝒮𝓉𝒾𝒸𝓀𝑒𝓇𝓈", "𝒵𝒶𝓃𝒾'𝓈 𝐵𝑜𝓉");

    // Send the final sticker with metadata
    await sock.sendMessage(
      jid,
      {
        sticker: { 
          url: outPath 
        }
      },
      { quoted: msg }
    );

    console.log("✅ Sticker created and sent successfully");

  } catch (e) {
    console.error("Sticker creation error:", e);
    let errorMessage = "⚠️ Failed to create sticker. ";
    
    if (e.message.includes('duration')) {
      errorMessage += "The media might be too long. Try something shorter than 7 seconds.";
    } else if (e.message.includes('codec') || e.message.includes('format')) {
      errorMessage += "Unsupported media format.";
    } else {
      errorMessage += "Please try with a different image or video.";
    }
    
    await sock.sendMessage(
      jid,
      { text: errorMessage },
      { quoted: msg }
    );
  } finally {
    // Clean up temporary files
    try {
      if (inputPath) await unlink(inputPath).catch(() => {});
      if (outPath) await unlink(outPath).catch(() => {});
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }
}
