import fs from 'fs';
import path from 'path';

const stickersPath = './stickers';
const moods = ['affectionate', 'cute', 'bossy', 'protective', 'professional', 'default'];

// Update ZANI_PROFILE to match actual sticker files
const ZANI_STICKERS = {
  affectionate: { folder: "affectionate", stickers: [] },
  cute: { folder: "cute", stickers: [] },
  bossy: { folder: "bossy", stickers: [] },
  protective: { folder: "protective", stickers: [] },
  professional: { folder: "professional", stickers: [] },
  default: { folder: "default", stickers: [] }
};

// Get actual sticker files
moods.forEach(mood => {
  const moodPath = path.join(stickersPath, mood);
  if (fs.existsSync(moodPath)) {
    const files = fs.readdirSync(moodPath).filter(f => f.endsWith('.webp'));
    const names = files.map(f => f.replace('.webp', ''));
    ZANI_STICKERS[mood].stickers = names;
    console.log(`✅ ${mood}: ${names.length} stickers - ${names.join(', ')}`);
  }
});

console.log('\n📋 Actual sticker files found:');
console.log(JSON.stringify(ZANI_STICKERS, null, 2));
