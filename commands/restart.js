import fs from 'fs';

export const name = "restart";
export const description = "Emergency system reboot (Owner only)";
export const ownerOnly = true;

function normalizeNumber(number) {
    return number.replace(/\D/g, "");
}

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const senderNumber = normalizeNumber(msg.key.participant || msg.key.remoteJid);

    let OWNERS = ["923219576020", "923440565387"];
    if (fs.existsSync('./owners.json')) {
        OWNERS = JSON.parse(fs.readFileSync('./owners.json', 'utf-8'));
    }
    const normalizedOwners = OWNERS.map(normalizeNumber);

    if (!normalizedOwners.includes(senderNumber)) {
        return sock.sendMessage(jid, { text: "❌ Only bot owners can use this command." }, { quoted: msg });
    }

    try {
        const mp4Path = './assets/zani-restart.mp4';
        let mediaSent = false;

        const captionText = `⚡ *ZANI REBOOT SEQUENCE INITIATED* ⚡
🔄 Status: Force restart engaged
⏰ ETA: 5 seconds
🎯 Mode: Emergency protocol
🔒 Security: Owner override accepted

_Systems undergoing controlled shutdown..._ 🚀
_I'll be back better than ever! Stand by..._ 💫`;

        if (fs.existsSync(mp4Path)) {
            await sock.sendMessage(
                jid,
                {
                    video: { url: mp4Path },
                    mimetype: 'video/mp4',
                    gifPlayback: true,
                    caption: captionText
                },
                { quoted: msg }
            );
            mediaSent = true;

            // Small delay to make sure WhatsApp processes media+caption
            await new Promise(res => setTimeout(res, 2000));
        } else {
            await sock.sendMessage(jid, { text: captionText }, { quoted: msg });
        }

        // Delay before restarting
        setTimeout(() => process.exit(0), mediaSent ? 7000 : 4000);

    } catch (err) {
        console.error("❌ Restart error:", err);
        await sock.sendMessage(jid, { text: "💥 *REBOOT FAILURE*\nManual intervention required." }, { quoted: msg });
    }
}
