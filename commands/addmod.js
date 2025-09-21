import { normalizeNumber } from "../utils/permissions.js";
import fs from 'fs';
import path from 'path';

export const name = "addmod";
export const description = "Add a user as bot moderator (Reply or mention)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const modsFile = path.join(process.cwd(), "moderators.json");

    // Get target user
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant || args[0];
    
    if (!target) {
        return sock.sendMessage(from, { text: "❌ Reply to user's message or mention someone to add as moderator." });
    }

    // Normalize target number
    let targetJid = target.includes("@") ? target.split(":")[0] : normalizeNumber(target) + "@s.whatsapp.net";
    const targetNormalized = targetJid.split("@")[0];

    // Check if already mod
    if (global.moderators.includes(targetNormalized)) {
        return sock.sendMessage(from, { 
            text: `❌ @${targetNormalized} is already a moderator.`, 
            mentions: [targetJid] 
        });
    }

    // Add to moderators list
    global.moderators.push(targetNormalized);
    fs.writeFileSync(modsFile, JSON.stringify(global.moderators, null, 2));

    await sock.sendMessage(from, { 
        text: `✅ Added @${targetNormalized} as bot moderator!`, 
        mentions: [targetJid] 
    });
}
