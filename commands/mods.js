import { normalizeNumber } from "../utils/permissions.js";

export const name = "mods";
export const description = "Show bot moderators with ASCII art";
export const adminOnly = true;

export async function execute(sock, msg) {
    const from = msg.key.remoteJid;
    
    if (global.moderators.length === 0) {
        return sock.sendMessage(from, { text: "🛡️ No moderators set for this bot." });
    }

    const modsList = global.moderators.map(n => `@${n}`).join("\n• ");
    const modsMentions = global.moderators.map(n => normalizeNumber(n) + "@s.whatsapp.net");
    
    const asciiArt = `
╔═══════════════════════╗
║       🛡️ MODS         ║
╠═══════════════════════╣
║ • ${modsList}
╚═══════════════════════╝
    `.trim();
    
    await sock.sendMessage(from, { 
        text: asciiArt, 
        mentions: modsMentions 
    });
}
