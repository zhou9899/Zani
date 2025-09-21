import dotenv from 'dotenv';
dotenv.config();
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const brainPath = path.join(process.cwd(), 'brain');
const memoryPath = path.join(process.cwd(), 'memory.json');
const userDbPath = path.join(process.cwd(), 'user-db.json');

// ------------------ Multiple Groq API Keys ------------------
let groqApiKeys = [];
let groqClients = [];
let currentKeyIndex = 0;

// Check for both plural and singular environment variable names
if (process.env.GROQ_API_KEYS) {
  groqApiKeys = process.env.GROQ_API_KEYS.split(',').map(key => key.trim()).filter(key => key);
} else if (process.env.GROQ_API_KEY) {
  // Fallback to singular name for backward compatibility
  groqApiKeys = [process.env.GROQ_API_KEY.trim()];
}

// Initialize clients if we have keys
if (groqApiKeys.length > 0) {
  groqClients = groqApiKeys.map(key => {
    try {
      return new Groq({ apiKey: key });
    } catch (error) {
      console.error('❌ Error initializing Groq client with key:', key.substring(0, 8) + '...');
      return null;
    }
  }).filter(client => client !== null);

  console.log(`✅ ${groqClients.length} Groq API keys initialized`);
} else {
  console.log('❌ No Groq API keys found. Bot will use brain and offline responses only.');
}

// Function to rotate API keys
function getNextGroqClient() {
  if (groqClients.length === 0) return null;

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
  try {
    return JSON.parse(fs.readFileSync(userDbPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Error loading user DB:', error);
    return {};
  }
}

function saveUserDb(db) {
  try {
    fs.writeFileSync(userDbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('❌ Error saving user DB:', error);
  }
}

USER_DB = loadUserDb();

export function registerUser(internalId, realNumber) {
  USER_DB[internalId] = realNumber;
  saveUserDb(USER_DB);
  console.log('✅ Registered user:', internalId, '->', realNumber);
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
    console.log('🆕 Auto-registered new user:', userNumber);
  }
}

// ------------------ Brain ------------------
function loadBrain() {
  const brain = {};
  if (!fs.existsSync(brainPath)) {
    fs.mkdirSync(brainPath, { recursive: true });
    console.log('📁 Created brain directory');
    return brain;
  }

  const files = fs.readdirSync(brainPath).filter(f => f.endsWith('.rive'));

  if (files.length === 0) {
    console.log('⚠️ No brain files found in /brain directory');
    return brain;
  }

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(brainPath, file), 'utf-8');
      const lines = content.split('\n');
      let currentTrigger = null;

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('//')) continue;

        if (cleanLine.startsWith('+')) {
          currentTrigger = cleanLine.slice(1).trim().toLowerCase();
          if (!brain[currentTrigger]) brain[currentTrigger] = [];
        } else if (cleanLine.startsWith('-') && currentTrigger) {
          brain[currentTrigger].push(cleanLine.slice(1).trim());
        } else {
          currentTrigger = null;
        }
      }
      console.log(`✅ Loaded brain file: ${file} with ${Object.keys(brain).length} triggers`);
    } catch (error) {
      console.error(`❌ Error loading brain file ${file}:`, error);
    }
  }

  console.log('🧠 Brain loaded:', Object.keys(brain).length, 'triggers');
  return brain;
}

const brain = loadBrain();

// ------------------ Memory ------------------
let MEMORY = { users: {}, lastCleaned: Date.now() };

function loadMemory() {
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify(MEMORY, null, 2));
    return MEMORY;
  }

  try {
    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!memory.lastCleaned || now - memory.lastCleaned > oneDay) {
      console.log('🧹 Cleaning expired memories...');
      for (const u in memory.users) {
        memory.users[u].interactions = memory.users[u].interactions.filter(i => now - i.timestamp <= oneDay);
        if (memory.users[u].interactions.length === 0) delete memory.users[u];
      }
      memory.lastCleaned = now;
      saveMemory(memory);
    }

    return memory;
  } catch (error) {
    console.error('❌ Error loading memory:', error);
    return { users: {}, lastCleaned: Date.now() };
  }
}

function saveMemory(memory) {
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  } catch (error) {
    console.error('❌ Error saving memory:', error);
  }
}

MEMORY = loadMemory();

// ------------------ Number Normalization ------------------
export function normalizeNumber(number) {
  let cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
  if (!cleanNumber.startsWith('92') && cleanNumber.length === 10) cleanNumber = '92' + cleanNumber;
  return cleanNumber;
}

// ------------------ Adaptive Personality Analysis ------------------
function analyzePersonality(message) {
  const text = message.toLowerCase();
  const traits = [];

  if (text.match(/\b(fuck|shit|asshole|bastard|bitch)\b/)) traits.push('uses vulgar language - needs discipline');
  if (text.match(/\b(stupid|dumb|idiot|moron|retard)\b/)) traits.push('insults others - immature behavior');
  if (text.match(/\b(please|pls|plz|thank|thanks)\b/)) traits.push('shows basic manners - acceptable');
  if (text.match(/\b(hi|hello|hey|greetings)\b/)) traits.push('attempts greeting - barely polite');
  if (text.length < 5) traits.push('lazy communicator - wasting my time');
  if (text.length > 50) traits.push('over-explainer - get to the point');

  if (text.includes('zhou')) traits.push('mentions Zhou - knows better than to disrespect my husband');

  if (!traits.length) traits.push('mediocre conversationalist - barely worth my attention');
  return traits;
}

// ------------------ User Memory ------------------
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

  // Update behavior profile (keep unique)
  traits.forEach(trait => {
    if (!userMem.behavior_profile.includes(trait)) {
      userMem.behavior_profile.push(trait);
    }
  });

  // Keep only last 8 interactions
  userMem.interactions.push({ message, timestamp: now });
  if (userMem.interactions.length > 8) {
    userMem.interactions = userMem.interactions.slice(-8);
  }

  userMem.last_updated = now;
  saveMemory(MEMORY);

  return traits;
}

// ------------------ Memory View ------------------
export function viewUserMemory(ownerNumber, targetNumber) {
  const mem = getUserMemory(targetNumber);
  if (!mem.behavior_profile?.length) return `📝 No memory found for ${getRealNumber(targetNumber)} - probably too boring to remember`;

  let summary = `╔══════════════════════════════╗\n║ 🧠 MEMORY - ${getRealNumber(targetNumber)} ║\n╠══════════════════════════════╣\n`;
  mem.behavior_profile.forEach(trait => summary += `║ • ${trait}\n`);
  summary += "╚══════════════════════════════╝";
  return summary;
}

// ------------------ Enhanced Brain Matching ------------------
function findBrainMatch(text) {
  const cleanText = text.toLowerCase().trim();

  // 1️⃣ Exact match (highest priority)
  if (brain[cleanText]?.length) {
    const response = brain[cleanText][Math.floor(Math.random() * brain[cleanText].length)];
    console.log('✅ Exact brain match:', cleanText, '->', response);
    return response;
  }

  // 2️⃣ Check for partial matches in brain triggers
  for (const trigger of Object.keys(brain)) {
    if (trigger !== '*' && cleanText.includes(trigger)) {
      const response = brain[trigger][Math.floor(Math.random() * brain[trigger].length)];
      console.log('✅ Partial brain match:', trigger, '->', response);
      return response;
    }
  }

  console.log('❌ No brain match found');
  return null;
}

// ------------------ Simplified Offline Response ------------------
function getOfflineResponse(text) {
  const lowerText = text.toLowerCase();

  // Zhou-related responses (ONLY Zhou response kept as requested)
  if (lowerText.includes('zhou')) {
    return "MY husband Zhou 💍! Don't even think about him. 🔪";
  }

  // Default response for everything else
  return "My API is being difficult. Don't bother me with trivialities. 😤";
}

// ------------------ Groq AI with Priority Order ------------------
export async function getAIResponse(msg, userNumber) {
  const text = msg.toLowerCase().trim();
  console.log('🧠 AI Input:', text);

  // Update memory first
  const userTraits = updateUserMemory(userNumber, msg);

  // 1️⃣ FIRST: Try Groq AI
  if (groqClients.length > 0) {
    let lastError = null;

    for (let attempt = 0; attempt < Math.min(2, groqClients.length); attempt++) {
      try {
        const groq = getNextGroqClient();
        console.log(`🔄 Trying API key ${currentKeyIndex}`);

        const context = userTraits.join(', ');
        const completion = await Promise.race([
          groq.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: `Zani: Strict, bossy, sarcastic AI. Zhou is my husband. Keep responses short. USER: ${context}`
              },
              { role: 'user', content: msg }
            ],
            model: 'llama-3.1-8b-instant',
            max_tokens: 50,
            temperature: 0.8,
            stream: false
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
          )
        ]);

        const aiText = completion.choices?.[0]?.message?.content?.trim();
        console.log('✅ Groq API success');
        return aiText || getOfflineResponse(text);

      } catch (error) {
        lastError = error;
        console.error(`❌ API key ${currentKeyIndex} failed:`, error.message);

        // If it's a timeout or permission error, try next key
        if (error.message.includes('Timeout') || error.message.includes('Permission')) {
          continue;
        }

        // For other errors, break and try brain
        break;
      }
    }
  }

  // 2️⃣ SECOND: Try brain matching if Groq fails
  const brainResponse = findBrainMatch(text);
  if (brainResponse) {
    console.log('✅ Using brain response');
    return brainResponse;
  }

  // 3️⃣ THIRD: Use offline response as last resort
  console.log('❌ All API attempts failed, using offline response');
  return getOfflineResponse(text);
}

// ------------------ Debug Functions ------------------
export function debugBrain() {
  return {
    triggerCount: Object.keys(brain).length,
    triggers: Object.keys(brain),
    hasWildcard: !!brain['*']
  };
}

export function debugMemory(userNumber) {
  return getUserMemory(userNumber);
}

// ------------------ API Key Management ------------------
export function getApiKeyStatus() {
  return {
    totalKeys: groqClients.length,
    currentKeyIndex: currentKeyIndex,
    keys: groqApiKeys.map((key, i) => ({
      index: i,
      key: key.substring(0, 8) + '...', // Partial for security
      active: i === currentKeyIndex
    }))
  };
}
