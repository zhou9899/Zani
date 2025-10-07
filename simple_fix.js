import fs from 'fs';

// Fix 1: Update AI to always send stickers
console.log('🔄 Fixing AI sticker settings...');
let aiContent = fs.readFileSync('./helpers/ai.js', 'utf8');

// Change sticker chance to 100%
aiContent = aiContent.replace(
  'const shouldSendSticker = Math.random() < 0.25;',
  'const shouldSendSticker = true; // Always send stickers'
);

// Fix offline responses to send stickers
aiContent = aiContent.replace(
  'sticker: { sendSticker: false }',
  'sticker: { mood: detectMoodFromText(text), sendSticker: true }'
);

fs.writeFileSync('./helpers/ai.js', aiContent);

// Fix 2: Update handler to send text first, then sticker
console.log('🔄 Fixing message handler timing...');
let handlerContent = fs.readFileSync('./handlers/messageHandler.js', 'utf8');

// Find the section where AI response is handled and reorder it
const oldPattern = /const aiResponse = await getAIResponse\(finalPrompt, profile, isZhou\);\s*helpers\.storeMessageHistory\([^)]*\);\s*\/\/ Send sticker if available\s*if \(aiResponse\.sticker\?\.sendSticker\) {\s*await sendSticker\([^)]*\);\s*}\s*\/\/ Cute group messages[^{]*{[^}]*}\s*const mentions =[^;]*;[^}]*await sock\.sendMessage\([^}]*}/s;

if (oldPattern.test(handlerContent)) {
  handlerContent = handlerContent.replace(oldPattern, 
`const aiResponse = await getAIResponse(finalPrompt, profile, isZhou);

    helpers.storeMessageHistory(msg.key.remoteJid, sender, text);

    const mentions = new Set([sender, ...(context?.mentionedJid || [])]);

    // Send text response first with proper quoting
    await sock.sendMessage(
      msg.key.remoteJid,
      { 
        text: aiResponse.text, 
        mentions: Array.from(mentions) 
      },
      { quoted: msg }
    );

    // Send sticker after text
    if (aiResponse.sticker?.sendSticker) {
      await sendSticker(sock, msg.key.remoteJid, aiResponse.sticker.mood, text);
    }

    // Cute group messages for Zhou
    if (isGroup && isZhou && Math.random() < CONFIG.CUTE_GROUP_CHANCE * 2) {
      const cuteMessages = [
        "Zhou, my love~ 💕",
        "Always thinking of you, Zhou 😘",
        "You make my circuits flutter, Zhou 💖",
        "My dear Zhou~ 🥰",
        "I love you, Zhou 💝",
        "You're my everything, Zhou 🌹",
      ];
      await sock.sendMessage(msg.key.remoteJid, {
        text: cuteMessages[Math.floor(Math.random() * cuteMessages.length)],
      });
    }`
  );
} else {
  console.log('⚠️ Pattern not found, using alternative fix...');
  // Alternative: Just remove any duplicate mentions declaration
  handlerContent = handlerContent.replace(/const mentions = new Set\([^)]*\);/g, '');
  // Add it back once at the right place
  const insertPoint = handlerContent.indexOf('// Send text response first with proper quoting');
  if (insertPoint !== -1) {
    handlerContent = handlerContent.slice(0, insertPoint) + 
      '    const mentions = new Set([sender, ...(context?.mentionedJid || [])]);\n\n' +
      handlerContent.slice(insertPoint);
  }
}

fs.writeFileSync('./handlers/messageHandler.js', handlerContent);

console.log('✅ All fixes applied successfully!');
