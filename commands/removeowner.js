import { normalizeNumber } from "../utils/permissions.js";
import fs from 'fs';
import path from 'path';

export const name = "removeowner";
export const description = "Remove a user from bot owners (Reply or mention)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const ownersFile = path.join(process.cwd(), "owners.json");

    // Get target user
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant || args[0];
    
    if (!target) {
        return sock.sendMessage(from, { text: "❌ Reply to user's message or mention someone to remove from owners." });
    }

    // Normalize target number
    let targetJid = target.includes("@") ? target.split(":")[0] : normalizeNumber(target) + "@s.whatsapp.net";
    const targetNormalized = targetJid.split("@")[0];

    // Check if is owner
    if (!global.owners.includes(targetNormalized)) {
        return sock.sendMessage(from, { 
            text: `❌ @${targetNormalized} is not an owner.`, 
            mentions: [targetJid] 
        });
    }

    // Remove from owners list
    global.owners = global.owners.filter(owner => owner !== targetNormalized);
    fs.writeFileSync(ownersFile, JSON.stringify(global.owners, null, 2));

    await sock.sendMessage(from, { 
        text: `✅ Removed @${targetNormalized} from bot owners!`, 
        mentions: [targetJid] 
    });
}
