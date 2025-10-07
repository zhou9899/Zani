import fs from 'fs';

// Read the current messageHandler.js
let handlerContent = fs.readFileSync('./handlers/messageHandler.js', 'utf8');

// Find and fix the AI response handling part
const fixedAISection = `
    const aiResponse = await getAIResponse(finalPrompt, profile, isZhou);

    helpers.storeMessageHistory(msg.key.remoteJid, sender, text);

    // Prepare mentions
    const mentions = new Set([sender, ...(context?.mentionedJid || [])]);

    // Send text response FIRST with proper quoting
    await sock.sendMessage(
      msg.key.remoteJid,
      { 
        text: aiResponse.text, 
        mentions: Array.from(mentions) 
      },
      { quoted: msg }  // This quotes the user's message
    );

    // Send sticker SECOND (after text)
    if (aiResponse.sticker?.sendSticker) {
      await sendSticker(sock, msg.key.remoteJid, aiResponse.sticker.mood, text);
    }`;

// Replace the AI handling section
handlerContent = handlerContent.replace(
  /const aiResponse = await getAIResponse\(finalPrompt, profile, isZhou\);[^}]*}[^}]*}[^}]*}[^}]*}[^}]*await sock\.sendMessage\([^)]*\);[^}]*}/s,
  fixedAISection
);

// Write the updated file
fs.writeFileSync('./handlers/messageHandler.js', handlerContent);
console.log('✅ Fixed: Text sends first with quotes, sticker sends after');
