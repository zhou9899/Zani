// commands/addmod.js
import { normalizeNumber } from "../utils/permissions.js";
import fs from 'fs';
import path from 'path';

export const name = "addmod";
export const description = "Add a user as bot moderator (Reply or mention)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;
  const modsFile = path.join(process.cwd(), "moderators.json");

  try {
    // EXPLICIT OWNER CHECK
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0].replace(/\D/g, '');
    const normalizedSender = normalizeNumber(senderNumber);
    
    const isOwner = global.owners?.some(owner => 
      normalizeNumber(owner.replace(/\D/g, "")) === normalizedSender
    );

    if (!isOwner) {
      return sock.sendMessage(from, { 
        text: "❌ Only bot owners can use this command." 
      }, { quoted: msg });
    }

    // Get target user
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant || args[0];

    if (!target) {
      return sock.sendMessage(from, { 
        text: "❌ Reply to user's message or mention someone to add as moderator.\nUsage: .addmod @user | .addmod 1234567890" 
      }, { quoted: msg });
    }

    // Normalize target number
    let targetJid = target.includes("@") ? target.split(":")[0] : normalizeNumber(target) + "@s.whatsapp.net";
    const targetNormalized = targetJid.split("@")[0];

    // Check if already mod
    if (global.moderators.includes(targetNormalized)) {
      return sock.sendMessage(from, {
        text: `❌ @${targetNormalized} is already a moderator.`,
        mentions: [targetJid]
      }, { quoted: msg });
    }

    // Add to moderators list
    global.moderators.push(targetNormalized);
    fs.writeFileSync(modsFile, JSON.stringify(global.moderators, null, 2));

    await sock.sendMessage(from, {
      text: `✅ Added @${targetNormalized} as bot moderator!`,
      mentions: [targetJid]
    }, { quoted: msg });

  } catch (err) {
    console.error("ADDMOD ERROR:", err);
    await sock.sendMessage(from, { 
      text: "❌ Failed to add moderator." 
    }, { quoted: msg });
  }
}
