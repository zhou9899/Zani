// helpers/stickerExif.js
import { readFile, writeFile } from "fs/promises";
import pkg from 'node-webpmux';
const { Image } = pkg;

export async function writeExif(webpPath, packName = "Zani Bot Stickers", author = "Zani's Bot") {
    try {
        console.log("📝 Adding EXIF metadata to sticker...");
        
        // Read the WebP file
        const webpBuffer = await readFile(webpPath);
        
        // Load the WebP image
        const img = new Image();
        await img.load(webpBuffer);

        // Create the EXIF metadata in WhatsApp format
        const exifData = {
            'sticker-pack-id': 'com.zani.bot.pack',
            'sticker-pack-name': packName,
            'sticker-pack-publisher': author,
            'android-app-store-link': 'https://play.google.com/store/apps/details?id=com.whatsapp',
            'ios-app-store-link': 'https://itunes.apple.com/app/whatsapp-messenger/id310633997',
            'emojis': ['✨'] // Default emoji
        };

        // Create the proper EXIF binary structure
        const jsonBuffer = Buffer.from(JSON.stringify(exifData), 'utf8');
        
        // EXIF header that WhatsApp recognizes
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        
        // Combine header with JSON data
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        
        // Update length field to match JSON data length
        exif.writeUInt32LE(jsonBuffer.length, 14);

        // Set the EXIF data on the WebP image
        img.exif = exif;

        // Save the modified image
        const finalBuffer = await img.save(null);
        
        // Write the final WebP file with EXIF metadata
        await writeFile(webpPath, finalBuffer);

        console.log("✅ EXIF metadata added successfully");
        
    } catch (error) {
        console.error("❌ Failed to add EXIF metadata:", error);
        throw error;
    }
}
