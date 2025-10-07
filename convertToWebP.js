import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const stickersPath = path.join(process.cwd(), 'stickers');

function convertToWebP(inputPath, outputPath) {
  try {
    const command = `magick "${inputPath}" -quality 85 "${outputPath}" 2>/dev/null || convert "${inputPath}" -quality 85 "${outputPath}"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (err) {
    console.log(`❌ Failed to convert ${path.basename(inputPath)}`);
    return false;
  }
}

console.log('🔄 Converting stickers to WebP format...');

const moodFolders = fs.readdirSync(stickersPath);
let convertedCount = 0;

moodFolders.forEach(mood => {
  const moodPath = path.join(stickersPath, mood);
  if (fs.statSync(moodPath).isDirectory()) {
    const files = fs.readdirSync(moodPath);
    
    files.forEach(file => {
      if (file.endsWith('.jpeg') || file.endsWith('.jpg')) {
        const inputPath = path.join(moodPath, file);
        const outputPath = path.join(moodPath, file.replace(/\.(jpeg|jpg)$/, '.webp'));
        
        if (convertToWebP(inputPath, outputPath)) {
          // Remove the original JPEG file after successful conversion
          fs.unlinkSync(inputPath);
          convertedCount++;
          console.log(`   ✅ ${file} → ${path.basename(outputPath)}`);
        }
      }
    });
  }
});

console.log(`\n✅ Conversion Complete! Converted ${convertedCount} stickers to WebP`);
