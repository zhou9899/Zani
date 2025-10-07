import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";

async function testConnection() {
  console.log("🔧 Testing WhatsApp Connection...");
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true, // Force QR display
      browser: ["Ubuntu", "Chrome", "22.04.4"],
      connectTimeoutMs: 30000,
    });

    sock.ev.on("connection.update", (update) => {
      const { connection, qr } = update;
      console.log('Connection:', connection);
      
      if (qr) {
        console.log('\n🎯 ACTUAL QR CODE RECEIVED:');
        console.log('QR Length:', qr.length);
        console.log('QR Starts with:', qr.substring(0, 10));
        console.log('QR Ends with:', qr.substring(qr.length - 10));
        console.log('\n📱 This is the REAL QR code to scan!');
        console.log('Length should be 200+ characters for WhatsApp Web');
      }
    });

    setTimeout(() => {
      console.log('\n⏰ Test complete');
      process.exit(0);
    }, 5000);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testConnection();
