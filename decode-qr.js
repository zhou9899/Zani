import fs from "fs";
import qrcode from "qrcode";

// Read the saved QR code and decode it
async function decodeQR() {
  try {
    const qrPath = "./whatsapp_qr.png";
    if (!fs.existsSync(qrPath)) {
      console.log("❌ QR code file not found");
      return;
    }

    console.log("🔍 Decoding QR code content...");
    
    // Try to read the QR code data
    const qrData = await qrcode.toString(qrPath, { type: 'terminal' });
    console.log("QR Code (terminal):");
    console.log(qrData);
    
  } catch (err) {
    console.error("❌ Decoding error:", err.message);
  }
}

decodeQR();
