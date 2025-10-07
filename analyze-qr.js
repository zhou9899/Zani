// Analyze the QR data structure
function analyzeQRData(qrString) {
  console.log("🔍 QR Data Analysis");
  console.log("===================");
  console.log("Length:", qrString.length);
  console.log("First 50 chars:", qrString.substring(0, 50));
  console.log("Last 50 chars:", qrString.substring(qrString.length - 50));
  
  // Check character composition
  const numericCount = (qrString.match(/\d/g) || []).length;
  const alphaCount = (qrString.match(/[a-zA-Z]/g) || []).length;
  const specialCount = (qrString.match(/[^a-zA-Z0-9]/g) || []).length;
  
  console.log("\nCharacter composition:");
  console.log("- Numbers:", numericCount);
  console.log("- Letters:", alphaCount);
  console.log("- Special chars:", specialCount);
  
  // Look for potential patterns
  console.log("\nPattern analysis:");
  console.log("Starts with '2@':", qrString.startsWith('2@'));
  console.log("Contains '/':", qrString.includes('/'));
  console.log("Contains '+':", qrString.includes('+'));
  
  // Try to find any 6-digit sequences
  const sixDigitMatches = qrString.match(/\d{6}/g);
  console.log("\n6-digit sequences:", sixDigitMatches || "None");
  
  // Look for other numeric patterns
  const allNumeric = qrString.match(/\d+/g);
  console.log("All numeric sequences:", allNumeric || "None");
  
  // Check if it's a WhatsApp Web code
  console.log("\nWhatsApp pattern check:");
  console.log("Contains 'web.whatsapp.com':", qrString.includes('web.whatsapp.com'));
  console.log("Contains 'whatsapp':", qrString.includes('whatsapp'));
  
  console.log("\n🎯 CONCLUSION:");
  if (qrString.startsWith('2@') && qrString.length > 200) {
    console.log("✅ This is a WhatsApp Web v2 QR code");
    console.log("❌ These QR codes use encrypted tokens, NOT numeric pairing codes");
    console.log("💡 You MUST scan this QR code with WhatsApp camera");
    console.log("📱 Go to: WhatsApp → Linked Devices → Link a Device → Scan QR");
    console.log("💾 QR code has been saved as 'whatsapp_qr.png'");
  } else {
    console.log("❓ Unknown QR format - try scanning with WhatsApp");
  }
}

// Sample QR data from your logs (truncated for analysis)
const sampleQR = "2@sRgDhjrWnY6ehbSe7yvZrNHWBucG8VGYx4Lqz6lonJH6HBG31bJQ+qQwX4Hd6LxHBMLCRD/5Gvt20/HP3VeDSA==";

analyzeQRData(sampleQR);
