
// handlers/messageHandler.js - Fixed WCG validation and turn management
import {
  getAIResponse,
  registerUser,
  isRegistered,
  getRealNumber,
  sendSticker,
} from "../helpers/ai.js";
import { handleAFKMentions } from "../commands/afk.js";
import { handleGroupParticipantsUpdate } from "./groupEvents.js";
import { chatHelpers } from "../commands/chat.js";

const CONFIG = {
  RATE_LIMIT_WINDOW: 2000,
  MAX_REQUESTS_PER_MINUTE: 30,
  AI_TRIGGERS: ["zani", "bot", "assistant", "help"],
  IGNORE_PREFIXES: [".", "!", "/", "#"],
};

const userCooldowns = new Map();
const messageHistory = new Map();

// Enhanced dictionary validation with better word filtering
const dictionaryAPIs = {
  freeDictionary: async (word) => {
    try {
      // Skip validation for very short words to reduce API calls
      if (word.length < 3) return false;
      
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (response.status === 200) {
        const data = await response.json();
        const isValid = Array.isArray(data) && data.length > 0;
        console.log(`📚 Dictionary API: "${word}" - ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;
      }
      console.log(`📚 Dictionary API: "${word}" - API returned ${response.status}`);
      return false;
    } catch (error) {
      console.log(`❌ Dictionary API error for "${word}":`, error.message);
      return false;
    }
  },
  
  // Enhanced common words list with better filtering
  commonWordsCheck: (word) => {
    const commonWords = new Set([
      'the','and','for','are','but','not','you','all','can','had','her','was','one','our',
      'out','get','has','him','his','how','man','new','now','old','see','two','way','who',
      'boy','did','its','let','put','say','she','too','use','that','with','have','this',
      'will','your','from','they','know','want','been','good','much','some','time','very',
      'when','come','here','just','like','long','make','many','over','such','take','than',
      'them','well','were','word','about','other','which','their','these','would','write',
      'more','number','people','water','first','could','after','where','most','world','think',
      'three','years','thing','look','before','great','means','right','through','being','might',
      'every','those','never','under','while','house','place','again','small','sound','large',
      'still','between','should','because','each','family','however','important','until','always',
      'different','another','something','sometimes','hello','world','game','play','word','chain',
      'letter','start','end','time','water','fire','earth','air','love','life','friend','school',
      'work','home','food','drink','sleep','wake','walk','run','jump','swim','read','write',
      'draw','paint','music','song','dance','happy','sad','angry','calm','fast','slow','high',
      'low','hot','cold','big','small','long','short','city','town','road','car','bus','train',
      'book','page','line','text','code','data','file','name','form','part','hand','head','face',
      'eye','ear','nose','mouth','hair','body','arm','leg','foot','back','side','door','window',
      'room','wall','floor','table','chair','bed','light','dark','day','night','week','month',
      'year','time','hour','minute','second','clock','watch','phone','computer','screen','key',
      'lock','box','bag','cup','plate','bowl','knife','fork','spoon','money','cash','card','bank',
      'shop','store','price','cost','free','paid','open','close','begin','stop','go','come','give',
      'take','bring','send','receive','buy','sell','pay','earn','learn','teach','study','class',
      'test','exam','score','mark','grade','level','point','line','circle','square','triangle',
      'shape','color','red','blue','green','yellow','black','white','gray','brown','orange','pink',
      'purple','animal','bird','fish','cat','dog','horse','cow','sheep','goat','chicken','duck',
      'tree','plant','flower','grass','leaf','fruit','apple','banana','orange','grape','melon',
      'berry','food','meal','breakfast','lunch','dinner','snack','water','juice','milk','coffee',
      'tea','sugar','salt','pepper','spice','rice','bread','cake','cookie','sweet','sour','bitter'
    ]);
    
    const isValid = commonWords.has(word.toLowerCase());
    console.log(`📚 Common words: "${word}" - ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  }
};

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

  shouldTriggerAI(text, context, isGroup, botNumber, sock, chatId) {
    const cleanBot = botNumber.replace(/\D/g, "");
    console.log("🔍 Checking AI trigger for text:", text);

    if (isGroup) {
      const chatEnabled = chatHelpers.getChatStatus(chatId);
      console.log(`💬 Chat status for ${chatId}: ${chatEnabled ? 'ENABLED' : 'DISABLED'}`);

      if (!chatEnabled) {
        console.log("🚫 Chat is disabled for this group - ignoring AI trigger");
        return false;
      }
    }

    if (CONFIG.IGNORE_PREFIXES.some(p => text.startsWith(p))) {
      console.log("🚫 Ignoring - prefix command");
      return false;
    }
    if (!isGroup) {
      console.log("✅ Triggering - private chat");
      return true;
    }

    if (context?.quotedMessage) {
      const quotedSender = (context.participant || "").replace(/\D/g, "");
      const botIdentifiers = [
        cleanBot,
        ...(global.owners || []).map(owner => owner.replace(/\D/g, "")),
        sock.user?.id.replace(/\D/g, ""),
      ].filter(id => id && id.length > 5);

      if (botIdentifiers.some(botId => botId === quotedSender)) {
        console.log("✅ Triggering - replying to bot");
        return true;
      }
    }

    if (context?.mentionedJid?.some(jid => jid.replace(/\D/g, "") === cleanBot)) {
      console.log("✅ Triggering - bot mentioned");
      return true;
    }

    const hasTrigger = CONFIG.AI_TRIGGERS.some(t => new RegExp("\\b" + t + "\\b", "i").test(text));
    const hasContent = text.replace(/@\d+/g, "").trim().length >= 2;

    if (hasTrigger && hasContent) {
      console.log("✅ Triggering - trigger word detected");
      return true;
    }

    console.log("🚫 Not triggering AI");
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

  // Check if message is a trivia answer
  isTriviaAnswer(text, chatId) {
    if (!global.triviaGames || !global.triviaGames[chatId]) {
      return false;
    }
    return /^[1-4]$/.test(text.trim());
  },

  // Check if message is a TTT move
  isTTTMove(text, chatId) {
    if (!global.tttGames || !global.tttGames[chatId]) {
      return false;
    }
    return /^[1-9]$/.test(text.trim());
  },

  // Check if message is a WCG word
  isWCGWord(text, chatId) {
    if (!global.gameSessions || !global.gameSessions[chatId]) {
      return false;
    }
    const word = text.trim().toLowerCase();
    return word.length >= 3 && /^[a-z]+$/.test(word);
  },

  // Validate English word using dictionary API with better filtering
  async isValidEnglishWord(word) {
    if (word.length < 3) return false;
    
    // First check common words (faster)
    const isCommon = dictionaryAPIs.commonWordsCheck(word);
    if (isCommon) {
      return true;
    }
    
    // Then try dictionary API for less common words
    try {
      console.log(`🔍 Checking word with dictionary API: ${word}`);
      const isValid = await dictionaryAPIs.freeDictionary(word);
      return isValid;
    } catch (error) {
      console.log(`❌ Dictionary API error for "${word}":`, error.message);
      return false;
    }
  }
};

export async function executeCommand(sock, msg, text, isGroup, sender, senderNumber) {
  console.log("⚡ Executing command:", text);
  const args = text.trim().split(/ +/);
  let cmdName = args.shift();

  for (const prefix of CONFIG.IGNORE_PREFIXES) {
    if (cmdName.startsWith(prefix)) {
      cmdName = cmdName.slice(prefix.length).toLowerCase();
      break;
    }
  }

  const cmd = global.commands[cmdName];
  if (!cmd) {
    console.log("❌ Command not found:", cmdName);
    return;
  }

  try {
    await cmd.execute(sock, msg, args);
    console.log("✅ Command executed:", cmdName);
  } catch (err) {
    console.error("❌ Command error:", err);
  }
}

// Handle trivia answers
async function handleTriviaAnswer(sock, msg, text, chatId, sender) {
  console.log("🎮 Handling trivia answer:", text);

  if (!global.triviaGames || !global.triviaGames[chatId]) {
    return false;
  }

  const trivia = global.triviaGames[chatId];
  const selectedIndex = parseInt(text.trim());

  if (Date.now() - trivia.startTime > 30000) {
    await sock.sendMessage(chatId, {
      text: `⏰ Time's up! The correct answer was: *${trivia.correctAnswer}*`
    });
    delete global.triviaGames[chatId];
    return true;
  }

  if (trivia.answeredUsers && trivia.answeredUsers.includes(sender)) {
    await sock.sendMessage(chatId, {
      text: "❌ You've already answered this trivia question! Wait for the next one."
    }, { quoted: msg });
    return true;
  }

  if (selectedIndex < 1 || selectedIndex > trivia.options.length) {
    await sock.sendMessage(chatId, {
      text: `❌ Please choose a valid option (1-${trivia.options.length})!`
    });
    return true;
  }

  const selectedAnswer = trivia.options[selectedIndex - 1];
  const isCorrect = selectedAnswer === trivia.correctAnswer;

  if (!trivia.answeredUsers) {
    trivia.answeredUsers = [];
  }

  trivia.answeredUsers.push(sender);

  if (isCorrect) {
    if (trivia.timeout) {
      clearTimeout(trivia.timeout);
    }
    await sock.sendMessage(chatId, {
      text: `🎉 *Correct!* The answer was: *${trivia.correctAnswer}*`
    }, { quoted: msg });
    delete global.triviaGames[chatId];
  } else {
    await sock.sendMessage(chatId, {
      text: `❌ *Wrong!* You chose "${selectedAnswer}". Try again next time!`
    }, { quoted: msg });
  }

  return true;
}

// Handle TTT moves
async function handleTTTMove(sock, msg, text, chatId, sender) {
  console.log("🎮 Handling TTT move:", text);

  if (!global.tttGames || !global.tttGames[chatId]) {
    return false;
  }

  const game = global.tttGames[chatId];
  
  if (!game.players || !game.board || game.players.length < 2) {
    console.log("❌ TTT game not ready or corrupted");
    return false;
  }

  const currentPlayer = game.players[game.currentIndex];
  console.log(`🔍 Turn check - Current player: ${currentPlayer}, Sender: ${sender}`);
  
  if (sender !== currentPlayer) {
    const currentPlayerName = currentPlayer?.split("@")[0] || "Unknown";
    const senderName = sender?.split("@")[0] || "Unknown";
    
    console.log(`❌ Not ${senderName}'s turn. Current player: ${currentPlayerName}`);
    
    await sock.sendMessage(chatId, {
      text: `❌ @${senderName}, it's not your turn! Current player: @${currentPlayerName}`,
      mentions: [sender, currentPlayer]
    }, { quoted: msg });
    return true;
  }

  const move = parseInt(text.trim()) - 1;
  
  if (move < 0 || move > 8) {
    await sock.sendMessage(chatId, {
      text: "❌ Invalid move! Please choose a number between 1-9."
    }, { quoted: msg });
    return true;
  }

  if (game.board[move] !== null) {
    await sock.sendMessage(chatId, {
      text: "❌ That position is already taken! Choose another."
    }, { quoted: msg });
    return true;
  }

  console.log(`✅ Valid TTT move by ${sender}: position ${move + 1}`);

  const symbol = game.symbols[sender];
  game.board[move] = symbol;

  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  
  const hasWon = wins.some(combo => combo.every(i => game.board[i] === symbol));
  if (hasWon) {
    const winnerName = sender?.split("@")[0] || "Unknown";
    await sock.sendMessage(chatId, {
      text: `🎉 @${winnerName} wins!\n\n${renderTTTBoard(game.board)}`,
      mentions: [sender]
    });
    delete global.tttGames[chatId];
    return true;
  }

  if (!game.board.includes(null)) {
    await sock.sendMessage(chatId, { 
      text: `🤝 It's a draw!\n\n${renderTTTBoard(game.board)}` 
    });
    delete global.tttGames[chatId];
    return true;
  }

  game.currentIndex = (game.currentIndex + 1) % game.players.length;
  const nextPlayer = game.players[game.currentIndex];
  const nextPlayerName = nextPlayer?.split("@")[0] || "Unknown";
  const currentPlayerName = sender?.split("@")[0] || "Unknown";

  await sock.sendMessage(chatId, {
    text: `✅ @${currentPlayerName} placed ${symbol === 'X' ? '❌' : '⭕'} at position ${move + 1}\n\n${renderTTTBoard(game.board)}\n\n🎯 *Next turn: @${nextPlayerName}*\n📝 Enter a number 1-9 to play!`,
    mentions: [sender, nextPlayer]
  });

  return true;
}

// Helper function to render TTT board
function renderTTTBoard(board) {
  const BOARD_EMOJIS = { X: "❌", O: "⭕" };
  
  return board
    .map((cell, idx) => (cell ? BOARD_EMOJIS[cell] : `${idx + 1}️⃣`))
    .reduce((acc, cell, idx) => {
      const endLine = (idx + 1) % 3 === 0 ? "\n" : " | ";
      return acc + cell + endLine;
    }, "")
    .trim();
}

// Handle WCG words - FIXED: Better validation and turn management
async function handleWCGWord(sock, msg, text, chatId, sender) {
  console.log("🎮 Handling WCG word:", text);

  if (!global.gameSessions || !global.gameSessions[chatId]) {
    return false;
  }

  const session = global.gameSessions[chatId];
  
  if (!session.players || !session.players[session.turnIndex]) {
    console.log("❌ WCG game state corrupted");
    delete global.gameSessions[chatId];
    return false;
  }

  const currentPlayer = session.players[session.turnIndex];

  // Check if it's the player's turn - FIXED: Better comparison
  if (sender !== currentPlayer) {
    const currentPlayerName = currentPlayer?.split("@")[0] || "Unknown";
    const senderName = sender?.split("@")[0] || "Unknown";
    
    console.log(`❌ Not ${senderName}'s turn. Current player: ${currentPlayerName}`);
    
    await sock.sendMessage(chatId, {
      text: `❌ @${senderName}, it's not your turn! Current player: @${currentPlayerName}`,
      mentions: [sender, currentPlayer]
    }, { quoted: msg });
    return true;
  }

  const word = text.trim().toLowerCase();

  // Calculate minimum word length based on number of games played
  const gamesPlayed = Math.floor(session.usedWords.size / session.players.length);
  const minWordLength = 3 + Math.floor(gamesPlayed / 2);

  console.log(`📏 Word length check: ${word.length} vs min ${minWordLength}, games played: ${gamesPlayed}`);

  // Validate word length
  if (word.length < minWordLength) {
    await sock.sendMessage(chatId, {
      text: `❌ Word must be at least ${minWordLength} letters! (After ${gamesPlayed} rounds)`,
      mentions: [sender]
    }, { quoted: msg });
    return true;
  }

  // Validate word contains only alphabets
  if (!/^[a-z]+$/.test(word)) {
    await sock.sendMessage(chatId, {
      text: "❌ Word must contain only alphabets (a-z)",
      mentions: [sender]
    }, { quoted: msg });
    return true;
  }

  // Validate word starts with correct letter
  if (session.lastWord && word[0] !== session.lastWord.slice(-1)) {
    await sock.sendMessage(chatId, {
      text: `❌ Word must start with "${session.lastWord.slice(-1).toUpperCase()}"`,
      mentions: [sender]
    }, { quoted: msg });
    return true;
  }

  // Check if word was already used
  if (session.usedWords.has(word)) {
    await sock.sendMessage(chatId, {
      text: `❌ "${word.toUpperCase()}" was already used! Try a different word.`,
      mentions: [sender]
    }, { quoted: msg });
    return true;
  }

  // Validate if it's a valid English word - FIXED: Always validate
  console.log(`🔍 Validating word: ${word}`);
  const isValidWord = await helpers.isValidEnglishWord(word);
  if (!isValidWord) {
    await sock.sendMessage(chatId, {
      text: `❌ "${word.toUpperCase()}" is not a valid English word! Use real words only.`,
      mentions: [sender]
    }, { quoted: msg });
    return true;
  }

  // Valid word - process it
  session.lastWord = word;
  session.usedWords.add(word);
  session.turnIndex = (session.turnIndex + 1) % session.players.length;

  // Clear previous timer and set new one
  clearTimeout(session.turnTimer);
  session.turnTimer = setTimeout(() => {
    handleWCGTimeout(sock, chatId);
  }, 30000);

  const nextPlayer = session.players[session.turnIndex];
  const startingLetter = session.lastWord.slice(-1).toUpperCase();

  const senderName = sender?.split("@")[0] || "Unknown";
  const nextPlayerName = nextPlayer?.split("@")[0] || "Unknown";

  await sock.sendMessage(chatId, {
    text: `✅ @${senderName} played: *${word.toUpperCase()}*\n📝 Words used: ${Array.from(session.usedWords).join(" → ")}\n🔤 Next word must start with: *${startingLetter}*\n📏 Minimum length: *${minWordLength} letters*\n⏰ Time limit: 30 seconds\n🎯 *Next turn: @${nextPlayerName}*`,
    mentions: [nextPlayer]
  });

  return true;
}

// Handle WCG timeout
async function handleWCGTimeout(sock, chatId) {
  const session = global.gameSessions[chatId];
  if (!session) return;

  const currentPlayer = session.players[session.turnIndex];
  session.players.splice(session.turnIndex, 1);

  if (session.players.length === 1) {
    const winnerPlayer = session.players[0];
    const winnerName = winnerPlayer?.split("@")[0] || "Unknown";
    await sock.sendMessage(chatId, {
      text: `🏆 @${winnerName} wins by timeout! Game over.`,
      mentions: [winnerPlayer]
    });
    delete global.gameSessions[chatId];
  } else if (session.players.length === 0) {
    await sock.sendMessage(chatId, { text: "❌ Game ended - no players left!" });
    delete global.gameSessions[chatId];
  } else {
    session.turnIndex = session.turnIndex % session.players.length;
    const nextPlayer = session.players[session.turnIndex];
    const currentPlayerName = currentPlayer?.split("@")[0] || "Unknown";
    const nextPlayerName = nextPlayer?.split("@")[0] || "Unknown";
    await sock.sendMessage(chatId, {
      text: `⏰ @${currentPlayerName} timed out! Removed from game.\n🎯 Next turn: @${nextPlayerName}`,
      mentions: [nextPlayer]
    });
    
    session.turnTimer = setTimeout(() => {
      handleWCGTimeout(sock, chatId);
    }, 30000);
  }
}

export async function handleAI(sock, msg, text, sender, senderNumber, isGroup, context, chatId) {
  console.log("🎯 Handling AI for message:", text);

  if (helpers.isRateLimited(senderNumber)) {
    console.log("⏰ Rate limited:", senderNumber);
    return;
  }

  const senderNormalized = senderNumber.replace(/\D/g, "");
  const isZhou = global.owners?.some(owner => owner.replace(/\D/g, "") === senderNormalized);

  console.log("💕 Zhou check:", senderNormalized, "is Zhou:", isZhou);

  try {
    const profile = {
      number: senderNumber,
      isZhou: isZhou,
    };

        
    console.log("🤖 Calling getAIResponse with chatId:", chatId);
    const aiResponse = await getAIResponse(text, profile, isZhou, chatId);
    helpers.storeMessageHistory(msg.key.remoteJid, sender, text);

    console.log("💬 Sending text response...");
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: aiResponse.text },
      { quoted: msg }
    );

    console.log("🎨 Checking for sticker to send...");
    console.log("📦 Sticker object:", aiResponse.sticker);

    if (aiResponse.sticker?.sendSticker && aiResponse.sticker.path) {
      console.log("🚀 Sending AI-chosen sticker:", aiResponse.sticker.path);
      const stickerSent = await sendSticker(sock, msg.key.remoteJid, aiResponse.sticker.path);
      if (stickerSent) {
        console.log("✅ Sticker sent successfully!");
      } else {
        console.log("❌ Failed to send sticker");
      }
    } else {
      console.log("❌ No sticker to send");
    }

  } catch (err) {
    console.error("❌ AI error:", err);
  }
}

export function handleMessages(sock) {
  sock.ev.on("group-participants.update", async (update) => {
    try {
      await handleGroupParticipantsUpdate(sock, update);
    } catch (err) {
      console.error("Group update error:", err);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages?.length) return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      try {
        const text = helpers.extractText(msg.message);
        if (!text) continue;

        await handleAFKMentions(sock, msg);

        const isGroup = msg.key.remoteJid.endsWith("@g.us");
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.split("@")[0].replace(/\D/g, "");
        const botNumber = (sock.user?.id.split(":")[0] || "64369295642766").replace(/\D/g, "");
        const chatId = msg.key.remoteJid;

        console.log("📨 Message from:", getRealNumber(senderNumber), "Content:", text, "Group:", isGroup);

        if (!isRegistered(senderNumber)) {
          console.log("👤 Registering new user:", senderNumber);
          registerUser(senderNumber, senderNumber);
        }

        helpers.storeMessageHistory(chatId, sender, text);

        // STEP 1: Check for game inputs FIRST
        if (helpers.isTriviaAnswer(text, chatId)) {
          console.log("🎯 Detected trivia answer");
          const handled = await handleTriviaAnswer(sock, msg, text, chatId, sender);
          if (handled) continue;
        }

        if (helpers.isTTTMove(text, chatId)) {
          console.log("🎯 Detected TTT move");
          const handled = await handleTTTMove(sock, msg, text, chatId, sender);
          if (handled) continue;
        }

        if (helpers.isWCGWord(text, chatId)) {
          console.log("🎯 Detected WCG word");
          const handled = await handleWCGWord(sock, msg, text, chatId, sender);
          if (handled) continue;
        }

        // STEP 2: Check for prefix-less commands
        const firstWord = text.split(/ +/)[0].toLowerCase();
        if (global.commands[firstWord]) {
          console.log(`🎮 Prefix-less command detected: ${firstWord}`);
          await executeCommand(sock, msg, text, isGroup, sender, senderNumber);
          continue;
        }

        // STEP 3: Check for prefix commands
        let isCommand = false;
        for (const prefix of CONFIG.IGNORE_PREFIXES) {
          if (text.startsWith(prefix)) {
            isCommand = true;
            break;
          }
        }

        if (isCommand) {
          await executeCommand(sock, msg, text, isGroup, sender, senderNumber);
          continue;
        }

        // STEP 4: Finally check for AI trigger
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
        if (helpers.shouldTriggerAI(text, contextInfo, isGroup, botNumber, sock, chatId)) {
          await handleAI(sock, msg, text, sender, senderNumber, isGroup, contextInfo, chatId);
        } else {
          console.log("🚫 Not triggering AI - no valid trigger detected");
        }

      } catch (err) {
        console.error("❌ Message processing error:", err);
      }
    }
  });
}

export const _testHelpers = helpers;

