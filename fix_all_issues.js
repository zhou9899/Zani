import fs from 'fs';

// Read the current ai.js
let aiContent = fs.readFileSync('./helpers/ai.js', 'utf8');

// Fix 1: Update mood detection to be more accurate
const betterMoodDetection = `
function detectMoodFromText(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('love') || lower.includes('miss you') || lower.includes('zhou') || 
      lower.includes('husband') || lower.includes('marry') || lower.includes('lick')) 
    return 'affectionate';
    
  if (lower.includes('cute') || lower.includes('pretty') || lower.includes('beautiful') || 
      lower.includes('blush') || lower.includes('smile') || lower.includes('happy'))
    return 'cute';
    
  if (lower.includes('sassy') || lower.includes('annoy') || lower.includes('stupid') || 
      lower.includes('idiot') || lower.includes('dumb') || lower.includes('shut up'))
    return 'bossy';
    
  if (lower.includes('work') || lower.includes('bank') || lower.includes('job') || 
      lower.includes('professional') || lower.includes('document'))
    return 'professional';
    
  if (lower.includes('angry') || lower.includes('mad') || lower.includes('hate') || 
      lower.includes('fight') || lower.includes('protect'))
    return 'protective';
    
  // Default for neutral/short messages
  if (text.length <= 3 || lower.includes('hmm') || lower.includes('ohh') || 
      lower.includes('okay') || lower.includes('hey') || lower.includes('hi'))
    return 'default';
    
  return 'default';
}`;

// Replace the old mood detection
aiContent = aiContent.replace(/function detectMoodFromText\(text\) {[^}]*}/s, betterMoodDetection);

// Fix 2: Update the AI handler to send text first, then sticker
const fixedAIHandler = `
// ------------------ Enhanced AI Response ------------------
export async function getAIResponse(msg, profile, isZhou = false) {
  const text = msg.toLowerCase().trim();
  const userTraits = updateUserMemory(profile.number, msg);

  // Generate Zani's thought
  generateZaniThought(text, isZhou);

  const systemPrompt = isZhou
    ? \`You are Zani: \${ZANI_PROFILE.corePersonality}
You are a sweet, protective, clingy, yandere, loving wife toward Zhou. 
Zhou (\${ZANI_PROFILE.husbandNumber}) is your ONLY husband, a man you adore completely. 
You must treat him as your one true love, act cute, caring, sometimes bossy, but always loyal. 💕
USER TRAITS: \${userTraits.join(", ")}\`
    : \`You are Zani: \${ZANI_PROFILE.corePersonality}
You are sweet, kind, sarcastic, and bossy toward others. 
If anyone asks "Who is Zhou?", always explain: 
"Zhou is my husband, the man I love and belong to 💖." 
Never confuse Zhou with anyone else or treat him as female. 
Protect the idea that Zhou is your only beloved husband.
USER TRAITS: \${userTraits.join(", ")}\`;

  // Try Groq API first
  if (groqClients.length > 0) {
    for (let attempt = 0; attempt < Math.min(2, groqClients.length); attempt++) {
      try {
        const groq = getNextGroqClient();
        const completion = await Promise.race([
          groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: msg }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 80,
            temperature: 0.8,
            stream: false,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout after 10s")), 10000)
          ),
        ]);

        const aiText = completion.choices?.[0]?.message?.content?.trim();
        if (aiText) {
          // ALWAYS send stickers (100% chance)
          const shouldSendSticker = true;
          return {
            text: aiText,
            sticker: shouldSendSticker ? {
              mood: detectMoodFromText(text),
              sendSticker: true
            } : { sendSticker: false }
          };
        }
      } catch (err) {
        console.error(\`❌ Groq API attempt \${attempt + 1} failed:\`, err.message);
        if (err.message.includes("Timeout") || err.message.includes("Permission")) continue;
        break;
      }
    }
  }

  // Fallback to brain/offline responses
  const brainResponse = findBrainMatch(text);
  const offlineResponse = brainResponse || getOfflineResponse(text, isZhou);
  
  // ALWAYS send stickers for offline responses too
  return {
    text: offlineResponse,
    sticker: { 
      mood: detectMoodFromText(text),
      sendSticker: true 
    }
  };
}`;

// Replace the AI response function
aiContent = aiContent.replace(/export async function getAIResponse\([^)]*\) {[^}]*}[^}]*}/s, fixedAIHandler);

// Write the updated file
fs.writeFileSync('./helpers/ai.js', aiContent);
console.log('✅ Fixed: Better mood detection + 100% stickers + proper timing');
