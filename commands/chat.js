// commands/chat.js
import fs from 'fs';
import path from 'path';

export const name = "chat";
export const description = "Enable or disable AI chat for this group";
export const ownerOnly = true; // Only bot owners can use this command
export const groupOnly = false; // Works in both groups and DMs
export const adminOnly = false; // Doesn't require group admin (ownerOnly takes precedence)

// Load config if exists - NOW STORES PER-GROUP SETTINGS
const configPath = path.join(process.cwd(), 'chat-config.json');
let chatConfig = {};

try {
  if (fs.existsSync(configPath)) {
    chatConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Loaded chat config for groups:', Object.keys(chatConfig).length);
  } else {
    // Create default config file
    fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
    console.log('📁 Created default chat config');
  }
} catch (error) {
  console.error('❌ Error loading chat config:', error);
  chatConfig = {};
}

// Helper function to get chat status for a group
function getChatStatus(groupId) {
  // If no config exists for this group, default to enabled
  if (chatConfig[groupId] === undefined) {
    return true;
  }
  return chatConfig[groupId];
}

// Helper function to set chat status for a group
function setChatStatus(groupId, enabled) {
  chatConfig[groupId] = enabled;
  try {
    fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving chat config:', error);
    return false;
  }
}

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith("@g.us");
  const command = args[0]?.toLowerCase();

  try {
    // EXPLICIT OWNER CHECK
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0].replace(/\D/g, '');
    
    const isOwner = global.owners?.some(owner => 
      owner.replace(/\D/g, "") === senderNumber
    );

    if (!isOwner) {
      return sock.sendMessage(jid, { 
        text: "❌ Only bot owners can use this command." 
      }, { quoted: msg });
    }

    if (!command) {
      const status = getChatStatus(jid) ? "ON ✅" : "OFF ❌";
      const location = isGroup ? "this group" : "your chats";
      const explanation = getChatStatus(jid) 
        ? "I'll respond to mentions, replies, and name triggers"
        : "I'll only respond to commands";
      
      return sock.sendMessage(jid, {
        text: `🤖 CHAT MODE for ${location}: ${status}\n${explanation}\n\nUse: .chat on / .chat off`
      }, { quoted: msg });
    }

    if (command === "on") {
      const success = setChatStatus(jid, true);
      
      if (success) {
        const location = isGroup ? "this group" : "your chats";
        await sock.sendMessage(jid, {
          text: `✅ AI chat enabled for ${location}. I'll respond when mentioned, replied to, or when my name is mentioned.`
        }, { quoted: msg });
        console.log(`✅ Chat enabled for ${jid}`);
      } else {
        await sock.sendMessage(jid, {
          text: "❌ Failed to save chat setting (check console)"
        }, { quoted: msg });
      }

    } else if (command === "off") {
      const success = setChatStatus(jid, false);
      
      if (success) {
        const location = isGroup ? "this group" : "your chats";
        await sock.sendMessage(jid, {
          text: `❌ AI chat disabled for ${location}. I'll only respond to commands.`
        }, { quoted: msg });
        console.log(`❌ Chat disabled for ${jid}`);
      } else {
        await sock.sendMessage(jid, {
          text: "❌ Failed to save chat setting (check console)"
        }, { quoted: msg });
      }

    } else if (command === "status") {
      const status = getChatStatus(jid) ? "ENABLED ✅" : "DISABLED ❌";
      const location = isGroup ? "This group" : "Your chats";
      
      await sock.sendMessage(jid, {
        text: `📊 Chat mode for ${location.toLowerCase()}: ${status}`
      }, { quoted: msg });

    } else if (command === "global") {
      // Global override for all groups (owner only)
      if (args[1] === "on") {
        // Enable chat for all existing groups
        Object.keys(chatConfig).forEach(groupId => {
          chatConfig[groupId] = true;
        });
        fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
        await sock.sendMessage(jid, {
          text: "✅ AI chat enabled for ALL groups. New groups will default to enabled."
        }, { quoted: msg });
      } else if (args[1] === "off") {
        // Disable chat for all existing groups
        Object.keys(chatConfig).forEach(groupId => {
          chatConfig[groupId] = false;
        });
        fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
        await sock.sendMessage(jid, {
          text: "❌ AI chat disabled for ALL groups. New groups will default to enabled."
        }, { quoted: msg });
      } else {
        await sock.sendMessage(jid, {
          text: "❌ Invalid global option. Use: .chat global on / .chat global off"
        }, { quoted: msg });
      }

    } else {
      await sock.sendMessage(jid, {
        text: "❌ Invalid option. Use: .chat on / .chat off / .chat status / .chat global"
      }, { quoted: msg });
    }

  } catch (err) {
    console.error("CHAT COMMAND ERROR:", err);
    await sock.sendMessage(jid, {
      text: "❌ Failed to execute chat command."
    }, { quoted: msg });
  }
}

// Export helper functions for use in messageHandler.js
export const chatHelpers = {
  getChatStatus,
  setChatStatus
};
