export const name = "ss";
export const aliases = ["screenshot", "capture"];
export const description = "Take screenshot of quoted message and make sticker";

import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { writeExif } from "../helpers/stickerExif.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) {
    return await sock.sendMessage(jid, {
      text: "❌ Please reply to a message with `.ss` to take a screenshot of it!"
    }, { quoted: msg });
  }

  try {
    // Get sender info for the quoted message
    const quotedSender = msg.message.extendedTextMessage.contextInfo.participant;
    const quotedSenderName = quotedSender.split('@')[0];
    
    // Extract text from quoted message
    const quotedText = extractTextFromMessage(quoted);
    
    if (!quotedText) {
      return await sock.sendMessage(jid, {
        text: "❌ The quoted message doesn't contain text to screenshot!"
      }, { quoted: msg });
    }

    await sock.sendMessage(jid, {
      text: "📸 Taking screenshot of the message... (This will look exactly like WhatsApp)"
    }, { quoted: msg });

    // Create realistic WhatsApp screenshot
    const stickerPath = await createWhatsAppScreenshot(quotedText, quotedSenderName);
    
    // Send as sticker
    await sock.sendMessage(jid, { 
      sticker: { url: stickerPath } 
    }, { quoted: msg });

    // Cleanup
    await unlink(stickerPath).catch(() => {});

  } catch (error) {
    console.error('Screenshot error:', error);
    await sock.sendMessage(jid, {
      text: "❌ Failed to take screenshot. Please try again or take a manual screenshot."
    }, { quoted: msg });
  }
}

function extractTextFromMessage(message) {
  if (!message) return '';
  
  const messageType = Object.keys(message)[0];
  switch (messageType) {
    case 'conversation':
      return message.conversation;
    case 'extendedTextMessage':
      return message.extendedTextMessage?.text || '';
    case 'imageMessage':
      return message.imageMessage?.caption || '';
    case 'videoMessage':
      return message.videoMessage?.caption || '';
    default:
      return '';
  }
}

async function createWhatsAppScreenshot(text, senderName) {
  const { execSync } = require("child_process");
  
  const outPath = path.join(tmpdir(), `whatsapp_ss_${Date.now()}.webp`);
  const pngPath = path.join(tmpdir(), `whatsapp_ss_${Date.now()}.png`);
  
  // WhatsApp colors
  const whatsappBg = "#0d1418"; // Dark theme background
  const myBubbleColor = "#005c4b"; // My messages (green)
  const theirBubbleColor = "#202c33"; // Their messages (gray)
  const textColor = "white";
  const timeColor = "#8696a0";
  const nameColor = "#00a884";
  
  // Current time for realism
  const now = new Date();
  const timeString = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
  
  // Escape text for ImageMagick
  const escapedText = text.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  const escapedName = senderName.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  
  try {
    // Create realistic WhatsApp chat screenshot focused on one message
    const magickCmd = `magick -size 512x512 \
xc:"${whatsappBg}" \
-fill "${theirBubbleColor}" -draw "roundrectangle 20,180 492,280 15,15" \
-fill "${nameColor}" -pointsize 12 -annotate +35+200 "${escapedName}" \
-fill "${textColor}" -pointsize 16 -annotate +35+230 "${escapedText}" \
-fill "${timeColor}" -pointsize 10 -annotate +400+270 "${timeString}" \
${pngPath}`;

    execSync(magickCmd, { stdio: 'pipe' });
    
    // Convert to WebP sticker
    await new Promise((resolve, reject) => {
      ffmpeg(pngPath)
        .outputOptions([
          '-vcodec', 'libwebp',
          '-lossless', '0',
          '-compression_level', '6',
          '-qscale', '80'
        ])
        .output(outPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    await unlink(pngPath).catch(() => {});
    
    // Add EXIF metadata
    await writeExif(outPath, "𝒵𝒶𝓃𝒾'𝓈 Screenshots", "Zani Bot");
    
    return outPath;
    
  } catch (error) {
    // Fallback: create simple version
    console.log('ImageMagick failed, using simple version');
    return await createSimpleScreenshot(text, outPath);
  }
}

async function createSimpleScreenshot(text, outPath) {
  const pngPath = path.join(tmpdir(), `simple_ss_${Date.now()}.png`);
  const { execSync } = require("child_process");
  
  const escapedText = text.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  
  const magickCmd = `magick -size 512x512 \
xc:"#0d1418" \
-fill "#202c33" -draw "roundrectangle 50,200 462,300 20,20" \
-fill "white" -pointsize 18 -annotate +70+240 "${escapedText}" \
${pngPath}`;
  
  execSync(magickCmd, { stdio: 'pipe' });
  
  await new Promise((resolve, reject) => {
    ffmpeg(pngPath)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-lossless', '0',
        '-compression_level', '6'
      ])
      .output(outPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
  
  await unlink(pngPath).catch(() => {});
  await writeExif(outPath, "𝒵𝒶𝓃𝒾'𝓈 Screenshots", "Zani Bot");
  
  return outPath;
}
