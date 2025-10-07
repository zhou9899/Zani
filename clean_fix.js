import fs from 'fs';

// Read the original file
let aiContent = fs.readFileSync('./helpers/ai.js', 'utf8');

// Fix 1: Change sticker chance to 100%
aiContent = aiContent.replace(
  'const shouldSendSticker = Math.random() < 0.25;',
  'const shouldSendSticker = true; // Always send stickers'
);

// Fix 2: Update offline responses to also send stickers
aiContent = aiContent.replace(
  'sticker: { sendSticker: false }',
  `sticker: { 
  mood: detectMoodFromText(text),
  sendSticker: true 
}`
);

// Fix 3: Update mood detection to be more accurate
const betterMoodDetection = `function detectMoodFromText(text) {
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

// Write the fixed file
fs.writeFileSync('./helpers/ai.js', aiContent);
console.log('✅ Fixed: 100% stickers + better mood detection');
