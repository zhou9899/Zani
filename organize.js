import fs from 'fs';
import path from 'path';

const stickersPath = path.join(process.cwd(), 'stickers');
const sourcePackPath = path.join(process.cwd(), 'Zani sticker pack');

// Create mood folders
const moodFolders = ['affectionate', 'cute', 'bossy', 'protective', 'professional', 'thinking', 'laughing', 'default'];

// Ensure stickers directory exists
if (!fs.existsSync(stickersPath)) {
  fs.mkdirSync(stickersPath, { recursive: true });
  console.log('✅ Created stickers directory');
}

// Create all mood folders
moodFolders.forEach(folder => {
  const folderPath = path.join(stickersPath, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

console.log('🎨 Created mood folders');

// Function to classify sticker by filename
function classifySticker(filename) {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('love') || lowerName.includes('heart') || lowerName.includes('kiss') || lowerName.includes('hug') || lowerName.includes('blush') || lowerName.includes('crush')) {
    return 'affectionate';
  } else if (lowerName.includes('cute') || lowerName.includes('smile') || lowerName.includes('happy') || lowerName.includes('joy') || lowerName.includes('grin') || lowerName.includes('sweet')) {
    return 'cute';
  } else if (lowerName.includes('sassy') || lowerName.includes('bossy') || lowerName.includes('angry') || lowerName.includes('mad') || lowerName.includes('annoy') || lowerName.includes('eyeroll')) {
    return 'bossy';
  } else if (lowerName.includes('protective') || lowerName.includes('guard') || lowerName.includes('shield') || lowerName.includes('defend') || lowerName.includes('serious') || lowerName.includes('death')) {
    return 'protective';
  } else if (lowerName.includes('professional') || lowerName.includes('work') || lowerName.includes('office') || lowerName.includes('business') || lowerName.includes('attire')) {
    return 'professional';
  } else if (lowerName.includes('think') || lowerName.includes('wonder') || lowerName.includes('question') || lowerName.includes('ponder') || lowerName.includes('curious')) {
    return 'thinking';
  } else if (lowerName.includes('laugh') || lowerName.includes('haha') || lowerName.includes('lol') || lowerName.includes('funny') || lowerName.includes('giggle')) {
    return 'laughing';
  } else {
    return 'default';
  }
}

// Organize stickers
console.log('🔄 Organizing stickers...');
const files = fs.readdirSync(sourcePackPath);
const moodCounts = {};

moodFolders.forEach(mood => {
  moodCounts[mood] = 0;
});

files.forEach((file, index) => {
  if (file.includes('.jpeg') || file.includes('.jpg')) {
    const mood = classifySticker(file);
    const ext = path.extname(file);
    const newFilename = `${mood}${moodCounts[mood]}${ext}`;
    const sourcePath = path.join(sourcePackPath, file);
    const destPath = path.join(stickersPath, mood, newFilename);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      moodCounts[mood]++;
      console.log(`   ${file} → ${mood}/${newFilename}`);
    } catch (err) {
      console.log(`❌ Error copying ${file}`);
    }
  }
});

console.log('\n✅ Organization Complete!');
console.log('📊 Summary:');
Object.entries(moodCounts).forEach(([mood, count]) => {
  if (count > 0) {
    console.log(`   ${mood}: ${count} stickers`);
  }
});
