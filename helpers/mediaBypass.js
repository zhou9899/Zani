// helpers/mediaBypass.js
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export async function downloadMediaSafe(message, sock) {
    try {
        console.log('🔄 Attempting media download...');
        
        // Method 1: Use Baileys with enhanced configuration
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: {
                    trace: () => {},
                    debug: () => {},
                    info: (msg) => console.log('ℹ️', msg),
                    warn: (msg) => console.log('⚠️', msg),
                    error: (msg) => console.log('❌', msg),
                },
                reuploadRequest: sock.updateMediaMessage,
                timeout: 60000, // 60 second timeout
                // Critical: Add these options to handle WhatsApp's blocking
                options: {
                    headers: {
                        'Origin': 'https://web.whatsapp.com',
                        'Referer': 'https://web.whatsapp.com/',
                        'User-Agent': 'WhatsApp/2.23.25.81 iOS/16.6.1 Device/iPhone14,2'
                    }
                }
            }
        );
        
        if (buffer && buffer.length > 0) {
            console.log(`✅ Success: Downloaded ${buffer.length} bytes`);
            return buffer;
        }
        
        throw new Error('Received empty buffer');
        
    } catch (error) {
        console.log('❌ Download failed:', error.message);
        
        // Method 2: Try to extract from thumbnail if available
        try {
            const thumbnailBuffer = extractThumbnail(message);
            if (thumbnailBuffer) {
                console.log('✅ Using embedded thumbnail as fallback');
                return thumbnailBuffer;
            }
        } catch (thumbError) {
            console.log('Thumbnail extraction failed:', thumbError.message);
        }
        
        throw error;
    }
}

// Extract thumbnail from message if available
function extractThumbnail(message) {
    if (message.message?.imageMessage?.jpegThumbnail) {
        return Buffer.from(message.message.imageMessage.jpegThumbnail);
    }
    if (message.message?.videoMessage?.jpegThumbnail) {
        return Buffer.from(message.message.videoMessage.jpegThumbnail);
    }
    if (message.message?.stickerMessage?.pngThumbnail) {
        return Buffer.from(message.message.stickerMessage.pngThumbnail);
    }
    return null;
}

// Debug function to check media availability
export function debugMedia(message) {
    console.log('🔍 Media Debug Info:');
    
    if (message.message?.imageMessage) {
        const img = message.message.imageMessage;
        console.log('📸 Image - Thumbnail:', img.jpegThumbnail ? 'Available' : 'Missing');
        console.log('📸 Image - URL:', img.url ? 'Present' : 'Missing');
        return 'image';
    }
    else if (message.message?.videoMessage) {
        const vid = message.message.videoMessage;
        console.log('🎥 Video - Thumbnail:', vid.jpegThumbnail ? 'Available' : 'Missing');
        console.log('🎥 Video - URL:', vid.url ? 'Present' : 'Missing');
        return 'video';
    }
    else if (message.message?.stickerMessage) {
        const stk = message.message.stickerMessage;
        console.log('🖼️ Sticker - Thumbnail:', stk.pngThumbnail ? 'Available' : 'Missing');
        console.log('🖼️ Sticker - URL:', stk.url ? 'Present' : 'Missing');
        return 'sticker';
    }
    else {
        console.log('❌ No media detected');
        return 'none';
    }
}
