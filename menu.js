import fs from 'fs';
import { prepareWAMessageMedia } from '@whiskeysockets/baileys';

export async function execute(client, jid) {
    try {
        // Path to your image
        const filePath = '../rimuru.jpg'; // Make sure the path is correct
        if (!fs.existsSync(filePath)) {
            console.log('File not found:', filePath);
            return;
        }

        // Prepare the media message
        const media = await prepareWAMessageMedia(
            { image: fs.readFileSync(filePath) },
            { upload: client.waUploadToServer }
        );

        // Send the menu message
        await client.sendMessage(jid, media, { caption: 'Here is your menu!' });
        console.log('Menu sent successfully!');
    } catch (err) {
        console.error('Error sending menu:', err);
    }
}
