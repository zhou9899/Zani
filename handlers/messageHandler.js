import { getAIResponse, updateUserMemory, registerUser, isRegistered, getRealNumber } from "../helpers/ai.js";
import { handleAFKMentions } from "../commands/afk.js";

const userCooldowns = new Map();
const userRequestTimestamps = new Map();
const groupAdminCache = new Map();

const CONFIG = {
  RATE_LIMIT_WINDOW: 2000, // 2 seconds
  MAX_REQUESTS_PER_MINUTE: 30,
  AI_TRIGGERS: ["zani", "bot", "assistant", "help"],
  IGNORE_PREFIXES: [".", "!", "/", "#"],
  CLEANUP_INTERVAL: 30000,
};

// -------------------- Cleanup Intervals --------------------
setInterval(() => {
  const now = Date.now();

  for (const [user, last] of userCooldowns.entries()) {
    if (now - last > 60000) userCooldowns.delete(user);
  }

  for (const [user, times] of userRequestTimestamps.entries()) {
    const recent = times.filter(t => now - t < 60000);
    if (!recent.length) userRequestTimestamps.delete(user);
    else userRequestTimestamps.set(user, recent);
  }

  for (const [key, ts] of groupAdminCache.entries()) {
    if (now - ts > 300000) groupAdminCache.delete(key);
  }
}, CONFIG.CLEANUP_INTERVAL);

// -------------------- Helpers --------------------
const helpers = {
  extractText(msg) {
    if (!msg) return "";
    const type = Object.keys(msg)[0];
    switch (type) {
      case "conversation": return msg.conversation;
      case "extendedTextMessage": return msg.extendedTextMessage?.text || "";
      case "imageMessage": return msg.imageMessage?.caption || "";
      case "videoMessage": return msg.videoMessage?.caption || "";
      default: return "";
    }
  },

  isRateLimited(userId) {
    const now = Date.now();
    const last = userCooldowns.get(userId);
    if (last && now - last < CONFIG.RATE_LIMIT_WINDOW) return true;
    userCooldowns.set(userId, now);
    return false;
  },

  checkRequestLimit(userId) {
    const now = Date.now();
    const timestamps = userRequestTimestamps.get(userId) || [];
    const recent = timestamps.filter(t => now - t < 60000);
    if (recent.length >= CONFIG.MAX_REQUESTS_PER_MINUTE) return true;
    recent.push(now);
    userRequestTimestamps.set(userId, recent);
    return false;
  },

  async isGroupAdmin(sock, groupId, userId) {
    const key = `${groupId}:${userId}`;
    if (groupAdminCache.has(key)) return groupAdminCache.get(key);
    try {
      const meta = await sock.groupMetadata(groupId);
      const participant = meta.participants.find(p => p.id === userId);
      const isAdmin = participant && (participant.admin === "admin" || participant.admin === "superadmin");
      groupAdminCache.set(key, isAdmin);
      return isAdmin;
    } catch {
      return false;
    }
  },

  isPrivileged(userId, owners = [], mods = []) {
    const normalized = userId.replace(/\D/g, "");
    const ownerList = owners.map(o => o.replace(/\D/g, ""));
    const modList = mods.map(m => m.replace(/\D/g, ""));
    return ownerList.includes(normalized) || modList.includes(normalized);
  },

  shouldTriggerAI(text, context, isGroup, botNumber) {
    const cleanBot = botNumber.replace(/\D/g, "");
    if (CONFIG.IGNORE_PREFIXES.some(p => text.startsWith(p))) return false;
    if (!isGroup) return true;

    // Reply to bot's message
    if (context?.quotedMessage) {
      const quotedSender = (context.participant || context?.quotedMessage?.sender || "").replace(/\D/g, "");
      if (quotedSender === cleanBot) return true;
    }

    // Mention bot
    if (context?.mentionedJid?.some(jid => jid.replace(/\D/g, "") === cleanBot)) return true;

    // Trigger word detection
    return CONFIG.AI_TRIGGERS.some(t => new RegExp(`\\b${t}\\b`, "i").test(text)) &&
      text.replace(/@\d+/g, "").trim().length >= 2;
  }
};

// -------------------- Command Execution --------------------
export async function executeCommand(sock, msg, text, isGroup, sender, senderNumber) {
  const args = text.trim().split(/ +/);
  const cmdName = args.shift().slice(1).toLowerCase();

  const cmd = global.commands[cmdName];
  if (!cmd) return console.log(`Unknown command: ${cmdName}`);

  const normalizedOwners = (global.owners || []).map(o => o.replace(/\D/g, ""));
  if (cmd.ownerOnly && !normalizedOwners.includes(senderNumber)) {
    return sock.sendMessage(msg.key.remoteJid, { text: "❌ Only bot owners can use this command." }, { quoted: msg });
  }

  if (isGroup && cmd.adminOnly) {
    const isAdmin = await helpers.isGroupAdmin(sock, msg.key.remoteJid, sender);
    const isPrivileged = helpers.isPrivileged(senderNumber, global.owners, global.moderators || []);
    if (!isAdmin && !isPrivileged) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Only admins/mods/owners can use this command." }, { quoted: msg });
    }
  }

  try {
    await cmd.execute(sock, msg, args);
  } catch (err) {
    console.error(`Error executing ${cmdName}:`, err);
    sock.sendMessage(msg.key.remoteJid, { text: "❌ Command execution error." }, { quoted: msg });
  }
}

// -------------------- AI Handler --------------------
export async function handleAI(sock, msg, text, sender, senderNumber, isGroup, context) {
  if (!global.chatEnabled) return;
  if (helpers.isRateLimited(senderNumber)) return;
  if (helpers.checkRequestLimit(senderNumber)) {
    return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Rate limit exceeded." }, { quoted: msg });
  }

  try {
    const aiReply = await getAIResponse(text, senderNumber);
    updateUserMemory(senderNumber, text);

    // Reply to sender + mentions
    const mentions = new Set([sender, ...(context?.mentionedJid || [])]);
    await sock.sendMessage(msg.key.remoteJid, { text: aiReply, mentions: Array.from(mentions) }, { quoted: msg });
  } catch (err) {
    console.error("AI response error:", err);
    sock.sendMessage(msg.key.remoteJid, { text: "🤖 AI error." }, { quoted: msg });
  }
}

// -------------------- Main Message Handler --------------------
export function handleMessages(sock) {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages?.length) return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    try {
      const text = helpers.extractText(msg.message);
      if (!text) return;

      await handleAFKMentions(sock, msg);

      const isGroup = msg.key.remoteJid.endsWith("@g.us");
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderNumber = sender.split("@")[0].replace(/\D/g, "");
      const botNumber = "64369295642766"; // YOUR BOT NUMBER

      if (!isRegistered(senderNumber)) registerUser(senderNumber, senderNumber);

      console.log("📨 Message from:", getRealNumber(senderNumber), "Content:", text);
      console.log("🏷️ Group chat:", isGroup);

      // Commands
      if (text.startsWith(".")) {
        await executeCommand(sock, msg, text, isGroup, sender, senderNumber);
        return;
      }

      // AI triggers
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
      if (helpers.shouldTriggerAI(text, contextInfo, isGroup, botNumber)) {
        await handleAI(sock, msg, text, sender, senderNumber, isGroup, contextInfo);
      } else {
        console.log("Not triggering AI - no valid trigger detected");
      }

    } catch (err) {
      console.error("Error in message handler:", err);
    }
  });
}

export const _testHelpers = helpers;
