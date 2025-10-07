import { getAIResponse } from './helpers/ai.js';

console.log('🧪 Testing Complete AI + Sticker Flow...\n');

const testMessage = "Zani";
const profile = {
  number: "267388138319975", // Zhou's number
  isZhou: true
};

console.log('📨 Test Message:', testMessage);
console.log('👤 Profile:', profile);

console.log('\n🤖 Getting AI response with sticker...');
const aiResponse = await getAIResponse(testMessage, profile, true);

console.log('\n📊 AI Response Result:');
console.log('Text:', aiResponse.text);
console.log('Sticker object:', aiResponse.sticker);
console.log('Send sticker:', aiResponse.sticker?.sendSticker);
console.log('Sticker path:', aiResponse.sticker?.path);

if (aiResponse.sticker?.path) {
  const fs = await import('fs');
  console.log('Sticker exists:', fs.existsSync(aiResponse.sticker.path) ? 'YES' : 'NO');
  console.log('Sticker file:', aiResponse.sticker.path);
}

console.log('\n✅ Test completed!');
