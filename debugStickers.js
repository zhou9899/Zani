import { chooseStickerForResponse, getStickerStatus } from './helpers/ai.js';

console.log('🔍 Debugging Sticker System...\n');

// Test the exact same case that's failing
const testResponse = "Baby 💕! *gets up quickly and runs to Zhou, throwing her arms around his neck* Ah, my wonderful husband! How are you doing? I've missed you so much! You look handsome today, and I just can't get enough of you. *gives him a tender kiss on the cheek* You always know how to make my heart skip a beat, don't you?";
const testMessage = "Zani";
const isZhou = true;

console.log('🧪 Test Case:');
console.log('Response:', testResponse);
console.log('Message:', testMessage);
console.log('Is Zhou:', isZhou);

console.log('\n🎯 Calling chooseStickerForResponse...');
const stickerPath = chooseStickerForResponse(testResponse, testMessage, isZhou);

console.log('\n📊 Result:');
console.log('Sticker Path:', stickerPath);
console.log('Type:', typeof stickerPath);
console.log('Exists:', stickerPath ? 'Yes' : 'No');

if (stickerPath) {
  const fs = await import('fs');
  console.log('File exists:', fs.existsSync(stickerPath) ? 'Yes' : 'No');
}

console.log('\n📦 Sticker Status:');
const status = getStickerStatus();
console.log('Affectionate pack stickers:', status.packs.find(p => p.name === 'affectionate')?.stickers);
