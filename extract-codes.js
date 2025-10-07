import fs from "fs";
import qrcode from "qrcode";
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";

// Enhanced QR code analysis
function extractPairingCodes(qrData) {
  console.log("🔍 DEEP QR CODE ANALYSIS");
  console.log("========================");
  console.log("QR Data:", qrData);
  console.log("Length:", qrData.length);
  
  // Method 1: Direct numeric extraction
  console.log("\n1. DIRECT NUMERIC EXTRACTION:");
  const allNumbers = qrData.match(/\d+/g) || [];
  console.log("All numbers found:", allNumbers);
  
  // Look for 6-digit patterns
  const sixDigitCodes = qrData.match(/\d{6}/g) || [];
  console.log("6-digit codes:", sixDigitCodes);
  
  // Method 2: Split by common separators
  console.log("\n2. SEPARATOR ANALYSIS:");
  const separators = ['@', '/', '?', '&', '=', '+', '-', '_', '.'];
  separators.forEach(sep => {
    if (qrData.includes(sep)) {
      const parts = qrData.split(sep);
      parts.forEach((part, index) => {
        if (part.length === 6 && /^\d+$/.test(part)) {
          console.log(`Found 6-digit code after '${sep}':`, part);
        }
      });
    }
  });
  
  // Method 3: Base64 decode and analyze
  console.log("\n3. BASE64 DECODING:");
  try {
    const decoded = Buffer.from(qrData, 'base64').toString('utf8');
    console.log("Base64 decoded:", decoded);
    const decodedNumbers = decoded.match(/\d{6}/g) || [];
    console.log("6-digit codes in decoded:", decodedNumbers);
  } catch (err) {
    console.log("Not base64 encoded");
  }
  
  // Method 4: Hex decode
  console.log("\n4. HEX DECODING:");
  try {
    if (qrData.length % 2 === 0) {
      const hexDecoded = Buffer.from(qrData, 'hex').toString('utf8');
      console.log("Hex decoded:", hexDecoded);
    }
  } catch (err) {
    console.log("Not hex encoded");
  }
  
  // Method 5: Look for WhatsApp specific patterns
  console.log("\n5. WHATSAPP PATTERNS:");
  const patterns = [
    /code[=:]?(\d{6})/i,
    /pair[=:]?(\d{6})/i,
    /link[=:]?(\d{6})/i,
    /(\d{3}[- ]?\d{3})/,
    /(\d{3}-\d{3})/
  ];
  
  patterns.forEach((pattern, i) => {
    const match = qrData.match(pattern);
    if (match) {
      console.log(`Pattern ${i+1} matched:`, match[1]);
    }
  });
  
  // Method 6: Character position analysis
  console.log("\n6. POSITION ANALYSIS:");
  for (let i = 0; i <= qrData.length - 6; i++) {
    const segment = qrData.substring(i, i + 6);
    if (/^\d+$/.test(segment)) {
      console.log(`Found at position ${i}:`, segment);
    }
  }
  
  return sixDigitCodes.length > 0 ? sixDigitCodes[0] : null;
}

async function getQRAndExtract() {
  console.log("🚀 GETTING QR CODE AND EXTRACTING NUMERIC CODES...");
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info_extract");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ["Ubuntu", "Chrome", "22.04.4"],
      connectTimeoutMs: 30000,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr } = update;
      
      if (qr) {
        console.log("\n" + "=".repeat(50));
        console.log("🎯 QR CODE CAPTURED - ANALYZING FOR NUMERIC CODES");
        console.log("=".repeat(50));
        
        const pairingCode = extractPairingCodes(qr);
        
        if (pairingCode) {
          console.log("\n🎉 SUCCESS! NUMERIC CODE FOUND!");
          console.log("🔢 PAIRING CODE:", pairingCode);
          console.log("\n📱 USE THIS CODE:");
          console.log("1. Open WhatsApp → Linked Devices");
          console.log("2. Tap 'Link a Device'");
          console.log(`3. Enter: ${pairingCode}`);
          console.log("\n💾 Also saving QR as backup...");
          
          // Save QR as image backup
          await qrcode.toFile('./whatsapp_qr_backup.png', qr);
          console.log("QR saved as: whatsapp_qr_backup.png");
        } else {
          console.log("\n❌ NO NUMERIC CODES FOUND IN QR DATA");
          console.log("WhatsApp QR codes are encrypted tokens");
          console.log("They don't contain human-readable numeric codes");
          console.log("💡 You must scan the QR code with WhatsApp");
        }
        
        process.exit(0);
      }
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      console.log("\n⏰ Timeout - no QR code received");
      process.exit(1);
    }, 15000);

  } catch (err) {
    console.error('Error:', err);
  }
}

getQRAndExtract();
