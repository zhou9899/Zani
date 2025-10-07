// commands/setleave.js
import { setLeaveMessage, removeLeaveMessage, getLeaveMessage } from "../handlers/groupEvents.js";

export const name = "setleave";
export const description = "Set leave message for this group";
export const usage = ".setleave <message> | .setleave on | .setleave off";
export const adminOnly = true;

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith("@g.us");

  if (!isGroup) {
    return sock.sendMessage(jid, { 
      text: "❌ This command only works in groups." 
    }, { quoted: msg });
  }

  try {
    // Check if user is admin - IMPROVED VERSION
    const groupMetadata = await sock.groupMetadata(jid);
    
    // Get sender JID from multiple possible sources
    let senderJid = msg.key.participant;
    
    // If no participant in key, check if it's a reply to someone else's message
    if (!senderJid && msg.message?.extendedTextMessage?.contextInfo?.participant) {
      senderJid = msg.message.extendedTextMessage.contextInfo.participant;
    }
    
    // If still no participant, use the remoteJid (bot's perspective)
    if (!senderJid) {
      senderJid = msg.key.remoteJid;
    }

    const isAdmin = groupMetadata.participants.find(p => p.id === senderJid)?.admin;

    if (!isAdmin) {
      return sock.sendMessage(jid, { 
        text: "❌ You need to be an admin to use this command." 
      }, { quoted: msg });
    }

    // Command logic
    if (!args.length) {
      const current = getLeaveMessage(jid);
      const statusText = current ? `✅ ON\n\nCurrent message: "${current}"` : "❌ OFF";
      return sock.sendMessage(jid, {
        text: `📝 *Leave Message Settings*\n\nUsage: ${this.usage}\nStatus: ${statusText}`
      }, { quoted: msg });
    }

    const firstArg = args[0].toLowerCase();

    if (firstArg === "off") {
      if (removeLeaveMessage(jid)) {
        return sock.sendMessage(jid, { 
          text: "✅ Leave message turned OFF for this group!" 
        }, { quoted: msg });
      }
      return sock.sendMessage(jid, { 
        text: "❌ Failed to turn off leave message!" 
      }, { quoted: msg });
    }

    if (firstArg === "on") {
      const current = getLeaveMessage(jid);
      if (current) {
        return sock.sendMessage(jid, { 
          text: `✅ Leave message is already ON!\n\nCurrent message: "${current}"` 
        }, { quoted: msg });
      }
      return sock.sendMessage(jid, { 
        text: "❌ No leave message set! Use .setleave <message> first." 
      }, { quoted: msg });
    }

    const leaveMessage = args.join(" ");
    if (setLeaveMessage(jid, leaveMessage)) {
      return sock.sendMessage(jid, {
        text: `✅ Leave message set and turned ON!\n\n"${leaveMessage}"\n\nUse .setleave off to disable`
      }, { quoted: msg });
    }

    return sock.sendMessage(jid, { 
      text: "❌ Failed to save leave message!" 
    }, { quoted: msg });

  } catch (err) {
    console.error("SETLEAVE ERROR:", err);
    return sock.sendMessage(jid, { 
      text: "❌ Failed to execute command." 
    }, { quoted: msg });
  }
}
