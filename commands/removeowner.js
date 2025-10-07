// commands/removeowner.js
import { normalizeNumber } from "../utils/permissions.js";
import fs from 'fs';
import path from 'path';

export const name = "removeowner";
export const description = "Remove a user from bot owners (Reply or mention)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;
  const ownersFile = path.join(process.cwd(), "owners.json");

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
        text: "❌ Reply to user's message or mention someone to remove from owners.\nUsage: .removeowner @user | .removeowner 1234567890" 
      }, { quoted: msg });
    }

    // Normalize target number
    let targetJid = target.includes("@") ? target.split(":")[0] : normalizeNumber(target) + "@s.whatsapp.net";
    const targetNormalized = targetJid.split("@")[0];

    // Check if is owner
    if (!global.owners.includes(targetNormalized)) {
      return sock.sendMessage(from, {
        text: `❌ @${targetNormalized} is not an owner.`,
        mentions: [targetJid]
      }, { quoted: msg });
    }

    // Prevent removing yourself
    if (targetNormalized === normalizedSender) {
      return sock.sendMessage(from, { 
        text: "❌ You cannot remove yourself as owner!" 
      }, { quoted: msg });
    }

    // Remove from owners list
    global.owners = global.owners.filter(owner => owner !== targetNormalized);
    fs.writeFileSync(ownersFile, JSON.stringify(global.owners, null, 2));

    await sock.sendMessage(from, {
      text: `✅ Removed @${targetNormalized} from bot owners!`,
      mentions: [targetJid]
    }, { quoted: msg });

  } catch (err) {
    console.error("REMOVEOWNER ERROR:", err);
    await sock.sendMessage(from, { 
      text: "❌ Failed to remove owner." 
    }, { quoted: msg });
  }
}
