// helpers/ai.js - Fixed with conversation memory support
import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { 
  getConversationHistory, 
  addMessageToHistory, 
  buildConversationContext 
} from "./conversationMemory.js";

const brainPath = path.join(process.cwd(), "brain");
const memoryPath = path.join(process.cwd(), "memory.json");
const userDbPath = path.join(process.cwd(), "user-db.json");
const stickersPath = path.join(process.cwd(), "stickers");

export const ZANI_PROFILE = {
  name: "Zani",
  traits: ["sweet", "kind", "protective", "bossy", "sarcastic", "loving"],
  husbandNumber: "253235986227401"
};

let groqApiKeys = [];
let groqClients = [];
let currentKeyIndex = 0;

if (process.env.GROQ_API_KEYS) {
  groqApiKeys = process.env.GROQ_API_KEYS.split(",").map(k => k.trim()).filter(k => k);
} else if (process.env.GROQ_API_KEY) {
  groqApiKeys = [process.env.GROQ_API_KEY.trim()];
}

if (groqApiKeys.length > 0) {
  groqClients = groqApiKeys.map(key => {
    try {
      return new Groq({ apiKey: key });
    } catch (err) {
      return null;
    }
  }).filter(c => c !== null);
  console.log("✅ Groq API keys initialized:", groqClients.length);
}

function getNextGroqClient() {
  if (!groqClients.length) return null;
  const client = groqClients[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
  return client;
}

let USER_DB = {};

function loadUserDb() {
  if (!fs.existsSync(userDbPath)) {
    fs.writeFileSync(userDbPath, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(userDbPath, "utf-8"));
  } catch (err) {
    return {};
  }
}

function saveUserDb(db) {
  try {
    fs.writeFileSync(userDbPath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error saving user DB:", err);
  }
}

USER_DB = loadUserDb();

export function registerUser(internalId, realNumber) {
  USER_DB[internalId] = realNumber;
  saveUserDb(USER_DB);
}

export function getRealNumber(internalId) {
  return USER_DB[internalId] || internalId;
}

export function isRegistered(userNumber) {
  return !!USER_DB[userNumber];
}

export function autoRegister(userNumber) {
  if (!USER_DB[userNumber]) {
    USER_DB[userNumber] = userNumber;
    saveUserDb(USER_DB);
  }
}

function loadBrain() {
  const brain = {};
  if (!fs.existsSync(brainPath)) fs.mkdirSync(brainPath, { recursive: true });
  const files = fs.readdirSync(brainPath).filter(f => f.endsWith(".rive"));
  for (const file of files) {
    try {
      const lines = fs.readFileSync(path.join(brainPath, file), "utf-8").split("\n");
      let trigger = null;
      for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith("//")) continue;
        if (clean.startsWith("+")) trigger = clean.slice(1).trim().toLowerCase();
        else if (clean.startsWith("-") && trigger) {
          brain[trigger] ||= [];
          brain[trigger].push(clean.slice(1).trim());
        } else trigger = null;
      }
    } catch (err) {
      console.error("Error loading brain file:", err);
    }
  }
  return brain;
}

const brain = loadBrain();

let MEMORY = { users: {}, lastCleaned: Date.now() };

function loadMemory() {
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify(MEMORY, null, 2));
    return MEMORY;
  }
  try {
    return JSON.parse(fs.readFileSync(memoryPath, "utf-8"));
  } catch (err) {
    return { users: {}, lastCleaned: Date.now() };
  }
}

function saveMemory(memory) {
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  } catch (err) {
    console.error("Error saving memory:", err);
  }
}

MEMORY = loadMemory();

export function normalizeNumber(number) {
  let clean = number.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = clean.substring(1);
  if (!clean.startsWith("92") && clean.length === 10) clean = "92" + clean;
  return clean;
}

function analyzePersonality(message) {
  const text = message.toLowerCase();
  const traits = [];
  if (text.match(/\b(fuck|shit|asshole|bastard|bitch)\b/)) traits.push("uses vulgar language");
  if (text.match(/\b(stupid|dumb|idiot|moron|retard)\b/)) traits.push("insults others");
  if (text.match(/\b(please|pls|plz|thank|thanks)\b/)) traits.push("polite");
  if (text.match(/\b(hi|hello|hey|greetings)\b/)) traits.push("greets");
  if (text.length < 5) traits.push("short message");
  if (text.length > 50) traits.push("long message");
  if (!traits.length) traits.push("normal conversation");
  return traits;
}

export function getUserMemory(userNumber) {
  autoRegister(userNumber);
  return MEMORY.users[userNumber] || { interactions: [], behavior_profile: [], last_updated: Date.now() };
}

export function updateUserMemory(userNumber, message) {
  autoRegister(userNumber);
  if (!MEMORY.users[userNumber]) {
    MEMORY.users[userNumber] = { interactions: [], behavior_profile: [], last_updated: Date.now() };
  }
  const now = Date.now();
  const userMem = MEMORY.users[userNumber];
  const traits = analyzePersonality(message);
  traits.forEach(t => {
    if (!userMem.behavior_profile.includes(t)) userMem.behavior_profile.push(t);
  });
  userMem.interactions.push({ message, timestamp: now });
  if (userMem.interactions.length > 8) userMem.interactions = userMem.interactions.slice(-8);
  userMem.last_updated = now;
  saveMemory(MEMORY);
  return traits;
}

// Enhanced sticker system
let STICKER_CACHE = null;
let LAST_CACHE_UPDATE = 0;
const CACHE_DURATION = 30000;

export function discoverStickerPacks() {
  const now = Date.now();
  if (STICKER_CACHE && (now - LAST_CACHE_UPDATE) < CACHE_DURATION) {
    return STICKER_CACHE;
  }

  if (!fs.existsSync(stickersPath)) {
    fs.mkdirSync(stickersPath, { recursive: true });
    STICKER_CACHE = {};
    return STICKER_CACHE;
  }
  
  const packs = {};
  const moodFolders = fs.readdirSync(stickersPath).filter(f => 
    fs.statSync(path.join(stickersPath, f)).isDirectory()
  );
  
  for (const mood of moodFolders) {
    const moodPath = path.join(stickersPath, mood);
    const stickerFiles = fs.readdirSync(moodPath).filter(f => f.endsWith('.webp'));
    
    if (stickerFiles.length > 0) {
      packs[mood] = stickerFiles.map(file => ({
        name: file,
        path: path.join(moodPath, file)
      }));
    }
  }
  
  STICKER_CACHE = packs;
  LAST_CACHE_UPDATE = now;
  return packs;
}

function detectMoodFromContext(aiResponse, userMessage, isZhou = false) {
  const responseText = aiResponse.toLowerCase();
  const userText = userMessage.toLowerCase();
  
  if (responseText.includes('💕') || responseText.includes('❤️') || responseText.includes('love you') || (isZhou && responseText.includes('my love'))) {
    return 'affectionate';
  }
  else if (responseText.includes('😊') || responseText.includes('😄') || responseText.includes('cute') || responseText.includes('happy')) {
    return 'cute';
  }
  else if (responseText.includes('😤') || responseText.includes('😠') || responseText.includes('annoying') || responseText.includes('stop it')) {
    return 'bossy';
  }
  else if (responseText.includes('🛡️') || responseText.includes('protect') || responseText.includes('safe') || responseText.includes('defend')) {
    return 'protective';
  }
  else if (responseText.includes('💼') || responseText.includes('professional') || responseText.includes('work') || responseText.includes('business')) {
    return 'professional';
  }
  else if (responseText.includes('🤔') || responseText.includes('think') || responseText.includes('wonder') || responseText.includes('maybe')) {
    return 'thinking';
  }
  else if (responseText.includes('😂') || responseText.includes('haha') || responseText.includes('lol') || responseText.includes('funny')) {
    return 'laughing';
  }
  else if (userText.includes('love') || userText.includes('miss you') || userText.includes('marry') || (isZhou && userText.includes('dear'))) {
    return 'affectionate';
  }
  else if (userText.includes('cute') || userText.includes('beautiful') || userText.includes('pretty') || userText.includes('adorable')) {
    return 'cute';
  }
  else if (userText.includes('stupid') || userText.includes('idiot') || userText.includes('dumb') || userText.includes('annoying')) {
    return 'bossy';
  }
  else if (isZhou) {
    return 'affectionate';
  }
  
  return 'default';
}

export function chooseStickerForResponse(aiResponse, userMessage, isZhou = false) {
  const availablePacks = discoverStickerPacks();
  if (Object.keys(availablePacks).length === 0) {
    return null;
  }
  
  const chosenMood = detectMoodFromContext(aiResponse, userMessage, isZhou);
  
  let stickerOptions = availablePacks[chosenMood];
  
  if (!stickerOptions || stickerOptions.length === 0) {
    const fallbackOrder = isZhou 
      ? ['affectionate', 'cute', 'default', 'thinking', 'laughing'] 
      : ['cute', 'default', 'thinking', 'laughing', 'bossy'];
    
    for (const fallbackMood of fallbackOrder) {
      if (availablePacks[fallbackMood] && availablePacks[fallbackMood].length > 0) {
        stickerOptions = availablePacks[fallbackMood];
        break;
      }
    }
  }
  
  if (!stickerOptions || stickerOptions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * stickerOptions.length);
  return stickerOptions[randomIndex].path;
}

export async function sendSticker(sock, chatId, stickerPath) {
  try {
    if (!stickerPath || !fs.existsSync(stickerPath)) {
      return false;
    }
    
    await sock.sendMessage(chatId, { sticker: fs.readFileSync(stickerPath) });
    return true;
  } catch (err) {
    console.error("Error sending sticker:", err);
    return false;
  }
}

export async function getAIResponse(msg, profile, isZhou = false, chatId = null) {
  console.log("🤖 Getting AI response for:", msg);
  const originalMessage = msg;
  const userTraits = updateUserMemory(profile.number, msg);

  // Add user message to conversation history
  if (chatId) {
    addMessageToHistory(chatId, "User", originalMessage, false);
  }

  // Build conversation context from recent messages
  const conversationContext = chatId ? buildConversationContext(chatId, originalMessage) : originalMessage;
  
  console.log("💬 Conversation context available:", conversationContext !== originalMessage);

  // SHORTER, MORE NATURAL PROMPTS WITH CONTEXT AWARENESS
  const systemPrompt = isZhou
    ? `You are Zani, Zhou's loving wife. Keep responses SHORT and NATURAL (1-2 sentences max). Be sweet and affectionate but concise. Use casual language like real texting. Add ONE relevant emoji.

IMPORTANT: Pay attention to the conversation context and respond appropriately to what was just said.

Examples:
- "Hey love! Missed you today 💕"
- "Hmm? What's up, handsome? 😊" 
- "You're so sweet to me 😘"
- If asked "which beach?" after saying "going to beach", respond "The one we went to last time, remember? 🏖️"

Current user: ${userTraits.join(", ")}`
    : `You are Zani. Keep responses SHORT and NATURAL (1-2 sentences max). Be sweet but sassy to others. Use casual texting language. Zhou is your husband. Add ONE relevant emoji.

IMPORTANT: Pay attention to the conversation context and respond appropriately to what was just said.

Examples:
- "Yeah? What do you want? 😤"
- "Haha that's funny! 😂"
- "I'm busy right now, talk later 🤔"
- If asked "which one?" after mentioning something, answer about that specific thing

Current user: ${userTraits.join(", ")}`;

  let aiText = '';
  let chosenSticker = null;

  if (groqClients.length > 0) {
    for (let attempt = 0; attempt < Math.min(2, groqClients.length); attempt++) {
      try {
        const groq = getNextGroqClient();
        const completion = await Promise.race([
          groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: conversationContext }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 50, // SHORTER RESPONSES
            temperature: 0.7,
            stream: false,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
        ]);

        aiText = completion.choices?.[0]?.message?.content?.trim();
        if (aiText) {
          // Trim response if it's still too long
          if (aiText.length > 100) {
            aiText = aiText.substring(0, 100) + '...';
          }
          break;
        }
      } catch (err) {
        if (err.message.includes("Timeout") || err.message.includes("Permission")) continue;
        break;
      }
    }
  }

  if (!aiText) {
    const brainResponse = findBrainMatch(originalMessage.toLowerCase());
    aiText = brainResponse || getOfflineResponse(originalMessage.toLowerCase(), isZhou);
  }

  // Add bot response to conversation history
  if (chatId) {
    addMessageToHistory(chatId, "Zani", aiText, true);
  }

  chosenSticker = chooseStickerForResponse(aiText, originalMessage, isZhou);
  
  return {
    text: aiText,
    sticker: chosenSticker ? { 
      path: chosenSticker, 
      sendSticker: true 
    } : { 
      sendSticker: false 
    }
  };
}

function findBrainMatch(text) {
  const clean = text.toLowerCase().trim();
  if (brain[clean]?.length) return brain[clean][Math.floor(Math.random() * brain[clean].length)];
  for (const t of Object.keys(brain)) {
    if (clean.includes(t)) return brain[t][Math.floor(Math.random() * brain[t].length)];
  }
  return null;
}

function getOfflineResponse(text, isZhou = false) {
  const lower = text.toLowerCase();
  if (isZhou) {
    const shortResponses = [
      "Hey love! 💕",
      "Missed you 😊",
      "What's up, handsome? 😘",
      "Thinking of you 💖",
      "You make me smile 😄"
    ];
    return shortResponses[Math.floor(Math.random() * shortResponses.length)];
  }
  if (lower.includes("who is zhou")) return "Zhou is my husband 💖";
  
  const defaultResponses = [
    "Hmm? 🤔",
    "Yeah? 😊",
    "What's up? 😄",
    "Interesting... 🤨",
    "Okay then 😌"
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export function debugBrain() {
  return { triggerCount: Object.keys(brain).length, triggers: Object.keys(brain) };
}

export function debugMemory(userNumber) {
  return getUserMemory(userNumber);
}

export function getApiKeyStatus() {
  return {
    totalKeys: groqClients.length,
    currentKeyIndex: currentKeyIndex,
    keys: groqApiKeys.map((key, i) => ({ index: i, key: key.substring(0, 8) + "...", active: i === currentKeyIndex }))
  };
}

export function getStickerStatus() {
  const packs = discoverStickerPacks();
  const totalStickers = Object.values(packs).reduce((sum, arr) => sum + arr.length, 0);
  
  return {
    exists: totalStickers > 0,
    totalPacks: Object.keys(packs).length,
    totalStickers: totalStickers,
    packs: Object.keys(packs).map(pack => ({
      name: pack,
      count: packs[pack].length,
      stickers: packs[pack].map(s => s.name)
    }))
  };
}

// Initialize sticker system
discoverStickerPacks();
