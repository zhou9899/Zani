import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const brainPath = path.join(process.cwd(), 'brain');
const memoryPath = path.join(process.cwd(), 'memory.json');
const userDbPath = path.join(process.cwd(), 'user-db.json');

// ------------------ Zani Profile ------------------
export const ZANI_PROFILE = {
  name: "Zani",
  traits: ["sweet", "kind", "protective", "bossy", "sarcastic"],
  husbandNumber: "253235986227401"
};

// ------------------ Groq API ------------------
let groqApiKeys = [];
let groqClients = [];
let currentKeyIndex = 0;

if (process.env.GROQ_API_KEYS) {
  groqApiKeys = process.env.GROQ_API_KEYS
    .split(',')
    .map(k => k.trim())
    .filter(k => k);
} else if (process.env.GROQ_API_KEY) {
  groqApiKeys = [process.env.GROQ_API_KEY.trim()];
}

if (groqApiKeys.length > 0) {
  groqClients = groqApiKeys.map(key => {
    try { return new Groq({ apiKey: key }); }
    catch (err) { console.error('❌ Groq init error:', key.slice(0,8)+'...', err); return null; }
  }).filter(c => c !== null);
  console.log(`✅ ${groqClients.length} Groq API keys initialized`);
} else console.log('❌ No Groq API keys found. Bot will use brain/offline responses only.');

function getNextGroqClient() {
  if (!groqClients.length) return null;
  const client = groqClients[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
  return client;
}

// ------------------ User DB ------------------
let USER_DB = {};
function loadUserDb() {
  if (!fs.existsSync(userDbPath)) {
    fs.writeFileSync(userDbPath, JSON.stringify({}, null, 2));
    return {};
  }
  try { return JSON.parse(fs.readFileSync(userDbPath, 'utf-8')); }
  catch (err) { console.error('❌ Error loading user DB:', err); return {}; }
}
function saveUserDb(db) {
  try { fs.writeFileSync(userDbPath, JSON.stringify(db, null, 2)); }
  catch (err) { console.error('❌ Error saving user DB:', err); }
}
USER_DB = loadUserDb();

export function registerUser(internalId, realNumber) {
  USER_DB[internalId] = realNumber;
  saveUserDb(USER_DB);
}
export function getRealNumber(internalId) {
  return USER_DB[internalId] || internalId;
}
export function isRegistered(userNumber) { return !!USER_DB[userNumber]; }
export function autoRegister(userNumber) {
  if (!USER_DB[userNumber]) {
    USER_DB[userNumber] = userNumber;
    saveUserDb(USER_DB);
  }
}

// ------------------ Brain ------------------
function loadBrain() {
  const brain = {};
  if (!fs.existsSync(brainPath)) fs.mkdirSync(brainPath, { recursive: true });
  const files = fs.readdirSync(brainPath).filter(f => f.endsWith('.rive'));
  for (const file of files) {
    try {
      const lines = fs.readFileSync(path.join(brainPath, file), 'utf-8').split('\n');
      let trigger = null;
      for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith('//')) continue;
        if (clean.startsWith('+')) trigger = clean.slice(1).trim().toLowerCase();
        else if (clean.startsWith('-') && trigger) brain[trigger] ||= [], brain[trigger].push(clean.slice(1).trim());
        else trigger = null;
      }
    } catch (err) { console.error(`❌ Error loading brain file ${file}:`, err); }
  }
  return brain;
}
const brain = loadBrain();

// ------------------ Memory ------------------
let MEMORY = { users: {}, lastCleaned: Date.now() };
function loadMemory() {
  if (!fs.existsSync(memoryPath)) { fs.writeFileSync(memoryPath, JSON.stringify(MEMORY, null, 2)); return MEMORY; }
  try {
    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
    const now = Date.now(), oneDay = 24*60*60*1000;
    if (!memory.lastCleaned || now - memory.lastCleaned > oneDay) {
      for (const u in memory.users) {
        memory.users[u].interactions = memory.users[u].interactions.filter(i => now - i.timestamp <= oneDay);
        if (!memory.users[u].interactions.length) delete memory.users[u];
      }
      memory.lastCleaned = now;
      saveMemory(memory);
    }
    return memory;
  } catch (err) { console.error('❌ Error loading memory:', err); return { users: {}, lastCleaned: Date.now() }; }
}
function saveMemory(memory) {
  try { fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2)); }
  catch (err) { console.error('❌ Error saving memory:', err); }
}
MEMORY = loadMemory();

// ------------------ Number Normalization ------------------
export function normalizeNumber(number) {
  let clean = number.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (!clean.startsWith('92') && clean.length === 10) clean = '92'+clean;
  return clean;
}

// ------------------ Personality Analysis ------------------
function analyzePersonality(message) {
  const text = message.toLowerCase();
  const traits = [];
  if (text.match(/\b(fuck|shit|asshole|bastard|bitch)\b/)) traits.push('uses vulgar language');
  if (text.match(/\b(stupid|dumb|idiot|moron|retard)\b/)) traits.push('insults others');
  if (text.match(/\b(please|pls|plz|thank|thanks)\b/)) traits.push('polite');
  if (text.match(/\b(hi|hello|hey|greetings)\b/)) traits.push('greets');
  if (text.length < 5) traits.push('short message');
  if (text.length > 50) traits.push('long message');
  if (!traits.length) traits.push('normal conversation');
  return traits;
}

// ------------------ User Memory ------------------
export function getUserMemory(userNumber) {
  autoRegister(userNumber);
  return MEMORY.users[userNumber] || { interactions: [], behavior_profile: [], last_updated: Date.now() };
}

export function updateUserMemory(userNumber, message) {
  autoRegister(userNumber);
  if (!MEMORY.users[userNumber]) MEMORY.users[userNumber] = { interactions: [], behavior_profile: [], last_updated: Date.now() };
  const now = Date.now();
  const userMem = MEMORY.users[userNumber];
  const traits = analyzePersonality(message);
  traits.forEach(t => { if (!userMem.behavior_profile.includes(t)) userMem.behavior_profile.push(t); });
  userMem.interactions.push({ message, timestamp: now });
  if (userMem.interactions.length > 8) userMem.interactions = userMem.interactions.slice(-8);
  userMem.last_updated = now;
  saveMemory(MEMORY);
  return traits;
}

// ------------------ Memory View ------------------
export function viewUserMemory(_, targetNumber) {
  const mem = getUserMemory(targetNumber);
  if (!mem.behavior_profile?.length) return `📝 No memory for ${getRealNumber(targetNumber)}`;
  let summary = `╔═════════ MEMORY - ${getRealNumber(targetNumber)} ║\n`;
  mem.behavior_profile.forEach(t => summary += `║ • ${t}\n`);
  summary += '╚═════════════════════════╝';
  return summary;
}

// ------------------ Self-Introduction ------------------
export function getSelfIntroduction() {
  return "Hi, I'm Zani! I'm sweet, protective, and sometimes a little bossy. 💕";
}

// ------------------ Brain Matching ------------------
function findBrainMatch(text) {
  const clean = text.toLowerCase().trim();
  if (brain[clean]?.length) return brain[clean][Math.floor(Math.random() * brain[clean].length)];
  for (const t of Object.keys(brain)) if (clean.includes(t)) return brain[t][Math.floor(Math.random() * brain[t].length)];
  return null;
}

// ------------------ Offline Response ------------------
function getOfflineResponse(text, isZhou=false) {
  const lower = text.toLowerCase();
  if (isZhou) return `💖 My beloved Zhou! I'm always here for you~ 💕`;
  return `😤 My API is busy, try later.`;
}

// ------------------ Groq AI ------------------
export async function getAIResponse(msg, userNumber, isZhou=false) {
  const text = msg.toLowerCase().trim();
  const userTraits = updateUserMemory(userNumber, msg);
  const systemPrompt = isZhou
    ? `You are Zani: sweet, yandere, cute, wife-like toward Zhou (${ZANI_PROFILE.husbandNumber}).`
    : `You are Zani: sweet, kind, bossy, sarcastic toward everyone else.`;

  if (groqClients.length > 0) {
    for (let attempt=0; attempt<Math.min(2, groqClients.length); attempt++) {
      try {
        const groq = getNextGroqClient();
        const completion = await Promise.race([
          groq.chat.completions.create({
            messages: [
{ role: 'system', content: `${systemPrompt} USER: ${userTraits.join(', ')}` },
              { role: 'user', content: msg }
            ],
            model: 'llama-3.1-8b-instant',
            max_tokens: 50,
            temperature: 0.8,
            stream: false
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000))
        ]);

        const aiText = completion.choices?.[0]?.message?.content?.trim();
        return aiText || getOfflineResponse(text, isZhou);
      } catch (err) {
        console.error(`❌ Groq API key ${currentKeyIndex} failed:`, err.message);
        if (err.message.includes('Timeout') || err.message.includes('Permission')) continue;
        break;
      }
    }
  }

  const brainResponse = findBrainMatch(text);
  if (brainResponse) return brainResponse;

  return getOfflineResponse(text, isZhou);
}

// ------------------ Debug & API Status ------------------
export function debugBrain() {
  return { triggerCount: Object.keys(brain).length, triggers: Object.keys(brain), hasWildcard: !!brain['*'] };
}

export function debugMemory(userNumber) {
  return getUserMemory(userNumber);
}

export function getApiKeyStatus() {
  return {
    totalKeys: groqClients.length,
    currentKeyIndex,
    keys: groqApiKeys.map((key, i) => ({ index: i, key: key.substring(0, 8)+'...', active: i === currentKeyIndex }))
  };
}
