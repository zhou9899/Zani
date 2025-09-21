import { normalizeNumber } from "../utils/permissions.js";
import fs from 'fs';
import path from 'path';

export const name = "removemod";
export const description = "Remove a user from bot moderators (Reply or mention)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const modsFile = path.join(process.cwd(), "moderators.json");

    // Get target user
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant || args[0];
    
    if (!target) {
        return sock.sendMessage(from, { text: "❌ Reply to user's message or mention someone to remove from moderators." });
    }

    // Normalize target number
    let targetJid = target.includes("@") ? target.split(":")[0] : normalizeNumber(target) + "@s.whatsapp.net";
    const targetNormalized = targetJid.split("@")[0];

    // Check if is mod
    if (!global.moderators.includes(targetNormalized)) {
        return sock.sendMessage(from, { 
            text: `❌ @${targetNormalized} is not a moderator.`, 
            mentions: [targetJid] 
        });
    }

    // Remove from moderators list
    global.moderators = global.moderators.filter(mod => mod !== targetNormalized);
    fs.writeFileSync(modsFile, JSON.stringify(global.moderators, null, 2));

    await sock.sendMessage(from, { 
        text: `✅ Removed @${targetNormalized} from bot moderators!`, 
        mentions: [targetJid] 
    });
}
