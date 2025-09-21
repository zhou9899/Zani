// commands/mem.js
import { 
  viewUserMemory, 
  getRealNumber, 
  normalizeNumber 
} from "../helpers/ai.js";

export const name = "mem";
export const description = "View your memory or others (Owner only)";

export async function execute(sock, msg, args) {
  try {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = normalizeNumber(senderJid.split('@')[0]);
    const owners = (global.owners || []).map(n => n.replace(/\D/g, ''));
    const isOwner = owners.includes(senderNumber);

    let targetNumber;

    // If owner replies to someone, get that user's number
    if (
      isOwner &&
      msg.message?.extendedTextMessage?.contextInfo?.participant
    ) {
      const participantJid =
        msg.message.extendedTextMessage.contextInfo.participant;
      targetNumber = normalizeNumber(participantJid.split('@')[0]);
    }
    // If owner provides number as argument
    else if (isOwner && args[0]) {
      targetNumber = args[0].replace(/\D/g, '');
    }
    // Otherwise default to sender's own number
    else {
      targetNumber = senderNumber;
    }

    // Security check: Non-owners can only view their own memory
    if (!isOwner && targetNumber !== senderNumber) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ You can only view your own memory. Use `.mem`" },
        { quoted: msg }
      );
    }

    // Fetch and send memory
    const memoryInfo = viewUserMemory(senderNumber, targetNumber);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: memoryInfo },
      { quoted: msg }
    );
  } catch (error) {
    console.error("❌ Memory command error:", error);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Error viewing memory." },
      { quoted: msg }
    );
  }
}
