// commands/restart.js
import fs from 'fs';

export const name = "restart";
export const description = "Emergency system reboot (Owner only)";
export const ownerOnly = true;

// Normalize numbers
function normalizeNumber(number) {
    return number.replace(/\D/g, "");
}

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const senderNumber = normalizeNumber(msg.key.participant || msg.key.remoteJid);

    // Load owners
    const ownersFile = './owners.json';
    let OWNERS = ["923219576020", "923440565387"]; // fallback
    if (fs.existsSync(ownersFile)) {
        OWNERS = JSON.parse(fs.readFileSync(ownersFile, 'utf-8'));
    }

    const normalizedOwners = OWNERS.map(normalizeNumber);

    if (!normalizedOwners.includes(senderNumber)) {
        return sock.sendMessage(jid, {
            text: "❌ Only bot owners can use this command."
        }, { quoted: msg });
    }

    try {
        const mp4Path = '/data/data/com.termux/files/home/bot/assets/zani-restart.mp4';
        let mediaSent = false;

        if (fs.existsSync(mp4Path)) {
            await sock.sendMessage(jid, {
                video: { url: mp4Path },
                gifPlayback: true,
                caption: `⚡ *ZANI REBOOT SEQUENCE INITIATED* ⚡

🔄 **Status:** Force restart engaged
⏰ **ETA:** 5 seconds
🎯 **Mode:** Emergency protocol
🔒 **Security:** Owner override accepted

_Systems undergoing controlled shutdown..._ 🚀
_I'll be back better than ever! Stand by..._ 💫`
            });
            mediaSent = true;
        } else {
            await sock.sendMessage(jid, {
                text: `⚡ *ZANI REBOOT SEQUENCE INITIATED* ⚡

🔄 **Status:** Force restart engaged
⏰ **ETA:** 5 seconds
🎯 **Mode:** Emergency protocol
🔒 **Security:** Owner override accepted

_Systems undergoing controlled shutdown..._ 🚀
_I'll be back better than ever! Stand by..._ 💫`
            }, { quoted: msg });
        }
        setTimeout(() => {
            if (global.sock) global.sock.end(() => process.exit(1));
            else process.exit(1);
        }, mediaSent ? 5000 : 3000);

    } catch (err) {
        console.error("❌ Restart error:", err);
        await sock.sendMessage(jid, { text: "💥 *REBOOT FAILURE*\nManual intervention required." }, { quoted: msg });
    }
}
