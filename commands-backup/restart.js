// commands/restart.js - FIXED WITH LID
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const name = "restart";
export const description = "Restart the bot with style (Owner only)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    
    // FIXED: Use LID comparison instead of phone number
    const senderLid = msg.key.participant?.split('@')[0];
    const botOwnerLid = "253235986227401"; // Your LID

    if (senderLid !== botOwnerLid) {
        return sock.sendMessage(jid, {
            text: "❌ This command is only for my owner."
        }, { quoted: msg });
    }

    try {
        const mp4Path = path.join(process.cwd(), 'assets', 'zani-restart.mp4');

        if (fs.existsSync(mp4Path)) {
            await sock.sendMessage(jid, {
                video: { url: mp4Path },
                gifPlayback: true,
                caption: "🔄 *Zani is restarting...* \nI'll be back in a few seconds! ⚡"
            }, { quoted: msg });
            console.log("🎬 Sent Zani restart MP4");
        } else {
            await sock.sendMessage(jid, {
                text: "🔄 *Zani is restarting...* \nI'll be back in a few seconds! ⚡"
            }, { quoted: msg });
        }

        // Restart after a short delay
        setTimeout(() => {
            console.log("🔄 Restarting bot...");
            process.exit(0);
        }, 3000);

    } catch (err) {
        console.error("❌ Restart error:", err);
        await sock.sendMessage(jid, {
            text: "❌ Restart failed! Please restart manually.\nError: " + err.message
        }, { quoted: msg });
    }
}
