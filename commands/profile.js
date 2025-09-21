// commands/profile.js
import { getUserProfile } from '../helpers/ai.js';
import fs from 'fs';
import path from 'path';

export const name = 'profile';
export const description = 'Show your ultimate fancy profile';

export async function execute(sock, msg, args) {
  const userId = (msg.key.participant || msg.key.remoteJid).split('@')[0].replace(/\D/g, '');
  const profile = getUserProfile(userId);

  // Prepare fallback image
  const fallbackImagePath = path.join(process.cwd(), 'rimuru.jpg');
  const hasFallback = fs.existsSync(fallbackImagePath);

  let pfpBuffer = null;
  try {
    // Try to get user's WhatsApp profile picture
    const pfpUrl = await sock.profilePictureUrl(msg.key.participant || msg.key.remoteJid, 'image');
    pfpBuffer = { url: pfpUrl };
  } catch {
    if (hasFallback) pfpBuffer = { url: 'file://' + fallbackImagePath };
  }

  // Compose ASCII fancy profile
  const text = `
╔════════════════════════════════╗
║        🎭 𝗨𝗟𝗧𝗜𝗠𝗔𝗧𝗘 𝗣𝗥𝗢𝗙𝗜𝗟𝗘       ║
╠════════════════════════════════╣
║ 🆔 Internal ID: ${userId}
║ 📞 Number: ${profile.number}
║ 🏷️ Nickname: ${profile.nickname || '❌ None'}
║ 🏷️ Name: ${profile.name || '❌ None'}
║ 🎂 Age: ${profile.age || '❌ Unknown'}
║ 📝 Bio: ${profile.bio || '❌ None'}
╠════════════════════════════════╣
║ 🧠 Memory Traits:
${profile.memoryTraits.length ? profile.memoryTraits.map(t => '║ • ' + t).join('\n') : '║ • Nothing yet...'}
╚════════════════════════════════╝
${profile.memoryTraits.length
    ? '💬 Zani thinks you are interesting enough to remember 😉'
    : '💤 Zani hasn\'t formed an opinion yet...'}
`;

  try {
    await sock.sendMessage(msg.key.remoteJid, {
      image: pfpBuffer,
      caption: text,
      contextInfo: { mentionedJid: [msg.key.participant || msg.key.remoteJid] }
    }, { quoted: msg });
  } catch {
    // Fallback to text-only if image fails
    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  }
}
