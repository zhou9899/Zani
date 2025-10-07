import { getStickerByMood } from './helpers/ai.js';

console.log("🧪 Testing sticker system...");

// Test different moods
const testMoods = ['affectionate', 'cute', 'bossy', 'professional', 'default'];
testMoods.forEach(mood => {
  const stickerPath = getStickerByMood(mood, 'test message');
  if (stickerPath) {
    console.log(`✅ ${mood}: ${stickerPath}`);
  } else {
    console.log(`❌ ${mood}: No sticker found`);
  }
});
