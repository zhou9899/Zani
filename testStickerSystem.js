import { getStickerStatus, chooseStickerForResponse } from './helpers/ai.js';

console.log('🎯 Testing Enhanced Sticker System...\n');

// Test 1: Check sticker status
console.log('📊 Sticker Pack Status:');
const status = getStickerStatus();
console.log('Total packs:', status.totalPacks);
console.log('Total stickers:', status.totalStickers);
console.log('\n📦 Available Packs:');
status.packs.forEach(pack => {
  console.log(`   ${pack.name}: ${pack.count} stickers`);
});

// Test 2: Test random selection for different moods
console.log('\n🎭 Testing Random Sticker Selection:');
const testCases = [
  { response: "I love you so much Zhou! 💕", message: "I miss you", isZhou: true, expectedMood: "affectionate" },
  { response: "That's so cute! 😊", message: "You're adorable", isZhou: false, expectedMood: "cute" },
  { response: "Stop being so annoying! 😤", message: "You're stupid", isZhou: false, expectedMood: "bossy" },
  { response: "I will protect you! 🛡️", message: "I'm scared", isZhou: true, expectedMood: "protective" },
  { response: "Let's discuss this professionally 💼", message: "Work meeting", isZhou: false, expectedMood: "professional" },
  { response: "Hmm, let me think about that 🤔", message: "What should I do?", isZhou: false, expectedMood: "thinking" },
  { response: "Haha that's hilarious! 😂", message: "Joke", isZhou: false, expectedMood: "laughing" }
];

testCases.forEach((test, index) => {
  console.log(`\n🧪 Test ${index + 1}: ${test.expectedMood}`);
  console.log(`   User: "${test.message}"`);
  console.log(`   Zani: "${test.response}"`);
  console.log(`   Is Zhou: ${test.isZhou}`);
  
  const stickerPath = chooseStickerForResponse(test.response, test.message, test.isZhou);
  if (stickerPath) {
    const stickerName = stickerPath.split('/').pop();
    console.log(`   ✅ Randomly selected: ${stickerName}`);
  } else {
    console.log(`   ❌ No sticker selected`);
  }
});

console.log('\n✨ Test completed!');
