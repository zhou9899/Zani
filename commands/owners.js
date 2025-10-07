import { normalizeNumber } from "../utils/permissions.js";

export const name = "owners";
export const description = "Show bot owners with ASCII art";
export const ownerOnly = true;

export async function execute(sock, msg) {
    const from = msg.key.remoteJid;
    
    if (global.owners.length === 0) {
        return sock.sendMessage(from, { text: "👑 No owners set for this bot." });
    }

    const ownersList = global.owners.map(n => `@${n}`).join("\n• ");
    const ownersMentions = global.owners.map(n => normalizeNumber(n) + "@s.whatsapp.net");
    
    const asciiArt = `
╔═══════════════════════╗
║       👑 OWNERS       ║
╠═══════════════════════╣
║ • ${ownersList}
╚═══════════════════════╝
    `.trim();
    
    await sock.sendMessage(from, { 
        text: asciiArt, 
        mentions: ownersMentions 
    });
}
