import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { writeFile, unlink, readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const name = "upscale";
export const description = "Upscale image quality 2x with HD quality";

export async function execute(sock, msg, args) {
    let inputPath, outputPath;
    
    try {
        const hasDirectImage = msg.message?.imageMessage;
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        const hasQuotedImage = contextInfo && contextInfo.quotedMessage?.imageMessage;
        
        if (!hasDirectImage && !hasQuotedImage) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ Please send or quote an image with the command to upscale it." 
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🔄 Upscaling image 2x with HD quality settings..." 
        }, { quoted: msg });

        // Download the media
        let targetMessage = msg;
        if (hasQuotedImage) {
            targetMessage = {
                key: {
                    remoteJid: msg.key.remoteJid,
                    id: contextInfo.stanzaId
                },
                message: contextInfo.quotedMessage
            };
        }

        const imageBuffer = await downloadMediaMessage(
            targetMessage, 
            "buffer", 
            {}, 
            { 
                logger: console, 
                reuploadRequest: sock.updateMediaMessage 
            }
        );

        console.log('Original image size:', imageBuffer.length, 'bytes');

        // Create temp files
        const timestamp = Date.now();
        inputPath = `/data/data/com.termux/files/home/temp_input_${timestamp}.jpg`;
        outputPath = `/data/data/com.termux/files/home/temp_output_${timestamp}.jpg`;
        
        // Save original image
        await writeFile(inputPath, imageBuffer);

        // Get original dimensions
        let originalDimensions = "Unknown";
        try {
            const identifyResult = await execAsync(`magick identify -format "%wx%h" "${inputPath}"`);
            originalDimensions = identifyResult.stdout.trim();
            console.log('Original dimensions:', originalDimensions);
        } catch (error) {
            console.log('Could not get original dimensions:', error.message);
        }

        // HD UPSCALE: Maximum quality settings
        console.log('Upscaling with HD quality...');
        await execAsync(`magick "${inputPath}" -resize 200% -filter Lanczos -unsharp 0.5x0.5+0.5+0.008 -quality 100 "${outputPath}"`);

        // Get new dimensions
        let newDimensions = "Unknown";
        try {
            const newIdentifyResult = await execAsync(`magick identify -format "%wx%h" "${outputPath}"`);
            newDimensions = newIdentifyResult.stdout.trim();
            console.log('New dimensions:', newDimensions);
        } catch (error) {
            console.log('Could not get new dimensions:', error.message);
        }
        
        // Read the upscaled image
        const upscaledBuffer = await readFile(outputPath);

        console.log('Upscaled image size:', upscaledBuffer.length, 'bytes');

        // Calculate size difference
        const originalSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2);
        const upscaledSizeMB = (upscaledBuffer.length / 1024 / 1024).toFixed(2);
        const sizeIncrease = ((upscaledBuffer.length / imageBuffer.length) * 100).toFixed(0);

        // SEND IN HD QUALITY - Same pattern as your yt command
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: upscaledBuffer,
                caption: `✅ HD Image upscaled 2x!\n📐 ${originalDimensions} → ${newDimensions}\n💾 ${originalSizeMB}MB → ${upscaledSizeMB}MB (${sizeIncrease}% larger)`,
                mimetype: "image/jpeg"
            },
            { quoted: msg }
        );

        console.log('HD upscale completed successfully!');

    } catch (error) {
        console.error('Upscale error:', error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ Error upscaling image: ${error.message}` 
        }, { quoted: msg });
    } finally {
        // Cleanup temp files
        try {
            if (inputPath) await unlink(inputPath).catch(() => {});
            if (outputPath) await unlink(outputPath).catch(() => {});
        } catch (cleanupError) {
            console.log('Cleanup error:', cleanupError);
        }
    }
}
