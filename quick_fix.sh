#!/bin/bash

# Backup the original file
cp helpers/ai.js helpers/ai.js.backup

# Replace the getStickerByMood function with one that uses actual file names
sed -i '/export function getStickerByMood/,/^}/c\
export function getStickerByMood(mood, text = "") {\
  const availableMoods = ["affectionate", "cute", "bossy", "protective", "professional", "default"];\
  let selectedMood = mood;\
  \
  if (!selectedMood) {\
    selectedMood = detectMoodFromText(text);\
  }\
  \
  if (!availableMoods.includes(selectedMood)) {\
    selectedMood = "default";\
  }\
  \
  // Map moods to actual sticker files\
  const stickerMap = {\
    affectionate: ["love1", "love3", "love7", "love8"],\
    cute: ["cute0", "cute3", "cute4", "cute5", "cute7", "cute8", "cute9"],\
    bossy: ["sassy0", "sassy1", "sassy2", "sassy4", "sassy6"],\
    protective: [],\
    professional: ["work1", "work5", "work6", "work7"],\
    default: ["neutral0", "neutral1", "neutral2", "neutral3", "neutral4", "neutral5", "neutral6", "neutral7", "neutral8", "neutral9"]\
  };\
  \
  const availableStickers = stickerMap[selectedMood];\
  if (!availableStickers.length) {\
    console.log(\`❌ No stickers available for mood: \${selectedMood}\`);\
    return null;\
  }\
  \
  const randomStickerName = availableStickers[Math.floor(Math.random() * availableStickers.length)];\
  const stickerPath = path.join(stickersPath, selectedMood, \`\${randomStickerName}.webp\`);\
  \
  if (fs.existsSync(stickerPath)) {\
    console.log(\`🎨 Selected \${selectedMood} sticker: \${randomStickerName}.webp\`);\
    return stickerPath;\
  } else {\
    console.log(\`❌ Sticker not found: \${stickerPath}\`);\
    return null;\
  }\
}' helpers/ai.js

echo "✅ Sticker system updated with actual file names"

# Also make sure sticker chance is 100%
sed -i 's/const shouldSendSticker = Math.random() < 0.25;/const shouldSendSticker = true; \/\/ Always send stickers/' helpers/ai.js

echo "✅ Sticker chance set to 100%"

# Verify the changes
echo ""
echo "🔧 Verification:"
grep -A5 "shouldSendSticker" helpers/ai.js | head -10
