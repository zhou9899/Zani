import { normalizeNumber } from "../utils/permissions.js";
import fs from 'fs';
import path from 'path';

export const name = "addowner";
export const description = "Add a user as bot owner (Reply or mention)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const ownersFile = path.join(process.cwd(), "owners.json");

    // Get target user
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant || args[0];
    
    if (!target) {
        return sock.sendMessage(from, { text: "❌ Reply to user's message or mention someone to add as owner." });
    }

    // Normalize target number
    let targetJid = target.includes("@") ? target.split(":")[0] : normalizeNumber(target) + "@s.whatsapp.net";
    const targetNormalized = targetJid.split("@")[0];

    // Check if already owner
    if (global.owners.includes(targetNormalized)) {
        return sock.sendMessage(from, { 
            text: `❌ @${targetNormalized} is already an owner.`, 
            mentions: [targetJid] 
        });
    }

    // Add to owners list
    global.owners.push(targetNormalized);
    fs.writeFileSync(ownersFile, JSON.stringify(global.owners, null, 2));

    await sock.sendMessage(from, { 
        text: `✅ Added @${targetNormalized} as bot owner!`, 
        mentions: [targetJid] 
    });
}
