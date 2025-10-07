const fs = require('fs');
const path = require('path');

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

// Create the fixed sticker configuration
const stickerConfig = `
// ------------------ Sticker System ------------------
export const ZANI_STICKERS = {
  affectionate: {
    folder: "affectionate",
    stickers: ${JSON.stringify(ZANI_STICKERS.affectionate.stickers, null, 2)}
  },
  cute: {
    folder: "cute", 
    stickers: ${JSON.stringify(ZANI_STICKERS.cute.stickers, null, 2)}
  },
  bossy: {
    folder: "bossy",
    stickers: ${JSON.stringify(ZANI_STICKERS.bossy.stickers, null, 2)}
  },
  protective: {
    folder: "protective",
    stickers: ${JSON.stringify(ZANI_STICKERS.protective.stickers, null, 2)}
  },
  professional: {
    folder: "professional",
    stickers: ${JSON.stringify(ZANI_STICKERS.professional.stickers, null, 2)}
  },
  default: {
    folder: "default",
    stickers: ${JSON.stringify(ZANI_STICKERS.default.stickers, null, 2)}
  }
};

export function getStickerByMood(mood, text = "") {
  const availableMoods = Object.keys(ZANI_STICKERS);
  let selectedMood = mood;
  
  if (!selectedMood) {
    selectedMood = detectMoodFromText(text);
  }
  
  if (!availableMoods.includes(selectedMood)) {
    selectedMood = 'default';
  }
  
  const moodConfig = ZANI_STICKERS[selectedMood];
  if (!moodConfig.stickers.length) {
    console.log(\`❌ No stickers available for mood: \${selectedMood}\`);
    return null;
  }
  
  const randomStickerName = moodConfig.stickers[Math.floor(Math.random() * moodConfig.stickers.length)];
  const stickerPath = path.join(stickersPath, moodConfig.folder, \`\${randomStickerName}.webp\`);
  
  if (fs.existsSync(stickerPath)) {
    console.log(\`🎨 Selected \${selectedMood} sticker: \${randomStickerName}.webp\`);
    return stickerPath;
  } else {
    console.log(\`❌ Sticker not found: \${stickerPath}\`);
    return null;
  }
}
`;

console.log('\n📋 Updated sticker configuration:');
console.log(stickerConfig);
