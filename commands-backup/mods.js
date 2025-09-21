// commands/mods.js
export const name = "mods";
export const description = "Manage moderators (Owner only)";
export const ownerOnly = true;

// Load moderators from file or use default
let MODERATORS = ["253235986227401"]; // FIXED: Use your actual number

// Try to load from file if exists
try {
    const fs = require('fs');
    const path = require('path');
    const modsFile = path.join(process.cwd(), 'moderators.json');

    if (fs.existsSync(modsFile)) {
        MODERATORS = JSON.parse(fs.readFileSync(modsFile, 'utf8'));
        console.log("📋 Loaded moderators from file:", MODERATORS);
    }
} catch (err) {
    console.log("📋 Using default moderators");
}

function saveModerators() {
    try {
        const fs = require('fs');
        const path = require('path');
        const modsFile = path.join(process.cwd(), 'moderators.json');
        fs.writeFileSync(modsFile, JSON.stringify(MODERATORS, null, 2));
    } catch (err) {
        console.error("❌ Failed to save moderators:", err);
    }
}

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const senderNumber = msg.key.participant?.split('@')[0] || msg.key.remoteJid?.split('@')[0];

    if (senderNumber !== "253235986227401") { // FIXED: Use your actual number
        return sock.sendMessage(jid, {
            text: "❌ Only the bot owner can manage moderators."
        }, { quoted: msg });
    }

    const action = args[0]?.toLowerCase();
    const number = args[1]?.replace(/\D/g, ''); // Clean number

    if (action === "add" && number) {
        if (!MODERATORS.includes(number)) {
            MODERATORS.push(number);
            saveModerators();
            await sock.sendMessage(jid, {
                text: `✅ Added ${number} to moderators.`
            });
        } else {
            await sock.sendMessage(jid, {
                text: `ℹ️ ${number} is already a moderator.`
            });
        }
    }
    else if (action === "remove" && number) {
        if (MODERATORS.includes(number)) {
            MODERATORS = MODERATORS.filter(n => n !== number);
            saveModerators();
            await sock.sendMessage(jid, {
                text: `✅ Removed ${number} from moderators.`
            });
        } else {
            await sock.sendMessage(jid, {
                text: `ℹ️ ${number} is not a moderator.`
            });
        }
    }
    else if (action === "list") {
        await sock.sendMessage(jid, {
            text: `📋 Moderators:\n${MODERATORS.map((n, i) => `${i+1}. ${n}`).join('\n')}`
        });
    }
    else {
        await sock.sendMessage(jid, {
            text: `❌ Usage:\n.mods add 1234567890\n.mods remove 1234567890\n.mods list`
        }, { quoted: msg });
    }
}
