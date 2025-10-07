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

const MAX_SIZE = 512;      // WhatsApp sticker dimension
const MAX_DURATION = 7;    // seconds for video/GIF
const TARGET_FPS = 15;     // for video/GIF

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

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

    const hasMedia = targetMessage.message?.imageMessage ||
                     targetMessage.message?.videoMessage ||
                     targetMessage.message?.stickerMessage;

    if (!hasMedia) {
        await sock.sendMessage(jid, { text: "❌ Please reply to an image, video, or sticker with `.s`" }, { quoted: msg });
        return;
    }

    let inputPath, outPath;

    try {
        // Download media
        const buffer = await downloadMediaMessage(targetMessage, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
        inputPath = path.join(tmpdir(), `sticker_in_${Date.now()}.dat`);
        await writeFile(inputPath, buffer);
        outPath = path.join(tmpdir(), `sticker_out_${Date.now()}.webp`);

        const isSticker = !!targetMessage.message?.stickerMessage;
        const isVideo = !!targetMessage.message?.videoMessage;
        const mimetype = targetMessage.message?.videoMessage?.mimetype || targetMessage.message?.imageMessage?.mimetype || '';
        const isGif = mimetype.includes("gif");

        // If already a static sticker, just add metadata
        if (isSticker && !isVideo && !isGif) {
            await writeFile(outPath, buffer);
            await writeExif(outPath, "𝒵𝒶𝓃𝒾'𝓈 Stickers", "Zani Bot");
            await sock.sendMessage(jid, { sticker: { url: outPath } }, { quoted: msg });
            return;
        }

        // FFmpeg scale + center-crop
        const vf = isVideo || isGif
            ? `scale=${MAX_SIZE}:${MAX_SIZE}:force_original_aspect_ratio=increase,crop=${MAX_SIZE}:${MAX_SIZE},format=rgba,fps=${TARGET_FPS}`
            : `scale=${MAX_SIZE}:${MAX_SIZE}:force_original_aspect_ratio=increase,crop=${MAX_SIZE}:${MAX_SIZE},format=rgba`;

        // Convert to webp sticker
        await new Promise((resolve, reject) => {
            const command = ffmpeg(inputPath);

            command.outputOptions([
                "-vcodec", "libwebp",
                "-vf", vf,
                isVideo || isGif ? "-loop 0" : "-preset picture",
                isVideo || isGif ? `-t ${MAX_DURATION}` : undefined,
                "-an",
                "-compression_level", "6",
                "-qscale", isVideo || isGif ? "75" : "90",
                "-vsync", "0"
            ].filter(Boolean));

            command
                .on("start", cmd => console.log("FFmpeg command:", cmd))
                .on("end", () => { console.log("✅ Sticker conversion done"); resolve(); })
                .on("error", err => { console.error("❌ FFmpeg error:", err); reject(err); })
                .save(outPath);
        });

        // Add EXIF metadata
        await writeExif(outPath, "𝒵𝒶𝓃𝒾'𝓈 Stickers", "Zani Bot");

        // Send sticker
        await sock.sendMessage(jid, { sticker: { url: outPath } }, { quoted: msg });
        console.log("✅ Sticker sent successfully");

    } catch (e) {
        console.error("Sticker creation error:", e);
        let msgText = "⚠️ Failed to create sticker.";
        if (e.message.includes("duration")) msgText += " Media may be too long. Try <7 seconds.";
        else if (e.message.includes("codec") || e.message.includes("format")) msgText += " Unsupported format.";
        await sock.sendMessage(jid, { text: msgText }, { quoted: msg });
    } finally {
        try {
            if (inputPath) await unlink(inputPath).catch(() => {});
            if (outPath) await unlink(outPath).catch(() => {});
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
    }
}
	
