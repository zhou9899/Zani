// ============================================
// index.js — Zani Bot (Stable, Auto-Healing)
// ============================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import qrcodeTerminal from "qrcode-terminal";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "@whiskeysockets/baileys";
import https from "https";
import axios from "axios";
import { Groq } from "groq-sdk";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== SECURE AXIOS ====================
const secureAxios = axios.create({
  proxy: false,
  timeout: 60000,
  maxRedirects: 5,
  httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: true }),
  headers: {
    "User-Agent": "WhatsApp/2.24.10.81 Android/13 Device/Samsung-S22",
    "Origin": "https://web.whatsapp.com",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
  },
});
global.axios = secureAxios;

// ==================== GROQ CLIENT ====================
export const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
console.log("✅ Groq Client initialized");

// ==================== BOT LOCK ====================
const LOCK_FILE = path.join(__dirname, "bot.lock");
let currentSocket = null;
let isConnecting = false;
let isShuttingDown = false;

// Prevent multiple instances
if (fs.existsSync(LOCK_FILE)) {
  try {
    const pid = parseInt(fs.readFileSync(LOCK_FILE, "utf8"));
    process.kill(pid, 0);
    console.error(`❌ Another bot instance is running (PID: ${pid})`);
    process.exit(1);
  } catch {
    fs.unlinkSync(LOCK_FILE);
  }
}
fs.writeFileSync(LOCK_FILE, process.pid.toString());

// ==================== CLEANUP & SHUTDOWN ====================
const cleanup = () => {
  if (fs.existsSync(LOCK_FILE) && parseInt(fs.readFileSync(LOCK_FILE, "utf8")) === process.pid) {
    fs.unlinkSync(LOCK_FILE);
    console.log("🧹 Cleanup completed");
  }
};

const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down...`);
  cleanup();
  if (currentSocket?.ws?.readyState === 1) currentSocket.ws.close();
  setTimeout(() => process.exit(0), 1000);
};

process.on("exit", cleanup);
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", err => {
  console.error("💥 Uncaught Exception:", err);
  cleanup();
  process.exit(1);
});

// ==================== START BOT ====================
async function startBot() {
  if (isConnecting || isShuttingDown) return;
  isConnecting = true;
  console.log("🚀 Connecting to WhatsApp...");

  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

    const sock = makeWASocket({
      auth: state,
      browser: Browsers.windows("Chrome"),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      printQRInTerminal: false,
      connectTimeoutMs: 45000,
      keepAliveIntervalMs: 25000,
      maxRetries: 3,
      fetchOptions: { axiosInstance: secureAxios, timeout: 60000 },
    });

    currentSocket = sock;
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrcodeTerminal.generate(qr, { small: true });
        console.log("📱 Scan the QR to connect.");
      }

      if (connection === "open") {
        console.log("✅ Connected!");
        isConnecting = false;

        const [{ loadCommands }, { handleMessages }] = await Promise.all([
          import("./handlers/commandLoader.js"),
          import("./handlers/messageHandler.js"),
        ]);

        await loadCommands(sock, path.join(__dirname, "commands"));
        handleMessages(sock);
        console.log("🎉 Bot ready!");
      }

      if (connection === "close") {
        isConnecting = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log(`❌ Connection closed. Code: ${code || "unknown"}`);
        if (code === DisconnectReason.loggedOut)
          fs.rmSync("./auth_info", { recursive: true, force: true });
        if (!isShuttingDown)
          setTimeout(startBot, code === DisconnectReason.loggedOut ? 3000 : 10000);
      }

      if (connection === "connecting")
        console.log("🔄 Reconnecting...");
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    isConnecting = false;
    if (!isShuttingDown) setTimeout(startBot, 10000);
  }
}

// ==================== INITIALIZE ====================
console.log("🤖 Zani Bot — Fast & Secure");
startBot();

// ==================== AUTO-RESTART ====================
setInterval(() => {
  if (!isConnecting && !isShuttingDown && currentSocket?.ws?.readyState === 1) {
    console.log("🔄 Scheduled maintenance restart...");
    currentSocket.ws.close();
  }
}, 6 * 60 * 60 * 1000); // every 6 hours
