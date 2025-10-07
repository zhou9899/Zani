// handlers/messageHandler.js - PART 1
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAIResponse,
  registerUser,
  isRegistered,
  getRealNumber,
  sendSticker,
} from "../helpers/ai.js";
import { handleAFKMentions } from "../commands/afk.js";
import { handleGroupParticipantsUpdate } from "./groupEvents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  RATE_LIMIT_WINDOW: 2000,
  MAX_REQUESTS_PER_MINUTE: 30,
  AI_TRIGGERS: ["zani", "bot", "assistant", "help"],
  IGNORE_PREFIXES: [".", "!", "/", "#"],
};

const userCooldowns = new Map();
const messageHistory = new Map();

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

  storeMessageHistory(chatId, sender, text) {
    if (!text) return;
    const key = chatId;
    const history = messageHistory.get(key) || [];
    history.push({ sender, text, timestamp: Date.now() });
    if (history.length > 6) history.shift();
    messageHistory.set(key, history);
  },

  isTriviaAnswer(text, chatId) {
    if (!global.triviaGames?.[chatId]) return false;
    return /^[1-4]$/.test(text.trim());
  },

  isTTTMove(text, chatId) {
    if (!global.tttGames?.[chatId]) return false;
    return /^[1-9]$/.test(text.trim());
  },

  async isWCGWord(text, chatId) {
    const session = global.gameSessions?.[chatId];
    if (!session) return false;
    const word = text.trim().toLowerCase();
    const minLen = session.minWordLength || 4;

    if (word.length < minLen) return false;
    if (!/^[a-z]+$/.test(word)) return false;
    if (session.lastWord && word[0] !== session.lastWord.slice(-1)) return false;
    if (session.usedWords.has(word)) return false;

    // Check dictionary API
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  }
};
