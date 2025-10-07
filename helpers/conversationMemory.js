// helpers/conversationMemory.js - Simple conversation memory
const conversationHistory = new Map();

export function addMessageToHistory(chatId, sender, message, isBot = false) {
  if (!conversationHistory.has(chatId)) {
    conversationHistory.set(chatId, []);
  }
  
  const history = conversationHistory.get(chatId);
  
  // Add the new message
  history.push({
    sender: isBot ? 'Zani' : 'User',
    message: message,
    timestamp: Date.now(),
    isBot
  });
  
  // Keep only last 4 messages (2 exchanges)
  if (history.length > 4) {
    history.shift();
  }
}

export function getConversationHistory(chatId) {
  return conversationHistory.get(chatId) || [];
}

export function buildConversationContext(chatId, currentMessage) {
  const history = getConversationHistory(chatId);
  
  if (history.length === 0) {
    return currentMessage;
  }
  
  // Build simple conversation context
  let context = "";
  
  history.forEach(msg => {
    context += `${msg.sender}: ${msg.message}\n`;
  });
  
  context += `User: ${currentMessage}`;
  
  return context;
}

export function clearConversationHistory(chatId) {
  conversationHistory.delete(chatId);
}
