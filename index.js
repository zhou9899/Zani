// ============================================
// index.js — Zani Bot (Clean & Stable)
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
import GroqClient from "@groq/sdk";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CLEAN ENV ====================
[
  "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
  "http_proxy", "https_proxy", "all_proxy",
  "NODE_TLS_REJECT_UNAUTHORIZED",
].forEach(v => {
  process.env[v] = "";
  delete process.env[v];
});

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

// ==================== GROQ API ====================
if (!process.env.GROQ_API_KEY) {
  console.warn("⚠️ GROQ_API_KEY not set! Check your GitHub secrets or .env");
}

global.groq = new GroqClient({
  apiKey: process.env.GROQ_API_KEY || "", // loads from env
});

// ==================== GLOBAL CONFIG ====================
const ownersFile = path.join(__dirname, "owners.json");
const modsFile = path.join(__dirname, "moderators.json");

global.owners = fs.existsSync(ownersFile) ? JSON.parse(fs.readFileSync(ownersFile, "utf8")) : [];
global.moderators = fs.existsSync(modsFile) ? JSON.parse(fs.readFileSync(modsFile, "utf8")) : [];

// Watch for changes
[ownersFile, modsFile].forEach(file => {
  if (fs.existsSync(file)) {
    fs.watchFile(file, { interval: 5000 }, () => {
      try {
        global[file.includes("owners") ? "owners" : "moderators"] =
          JSON.parse(fs.readFileSync(file, "utf8"));
        console.log(`🔄 ${path.basename(file)} updated`);
      } catch (err) {
        console.error(`❌ Failed to update ${file}: ${err.message}`);
      }
    });
  }
});

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

    // Silence noisy Baileys logs
    const originalLog = console.log;
    const ignoredPatterns = [
      "Closing stale open session",
      "Closing session:",
      "uploading pre-keys",
      "pre-key",
      "0 pre-keys found on server",
    ];
    console.log = (...args) => {
      const msg = args.join(" ");
      if (ignoredPatterns.some(p => msg.includes(p))) return;
      originalLog(...args);
    };

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
      qrTimeout: 60000,
      fetchOptions: { axiosInstance: secureAxios, timeout: 60000 },
    });

    currentSocket = sock;
    sock.ev.on("creds.update", saveCreds);

    // Connection updates
    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrcodeTerminal.generate(qr, { small: true });
        console.log("📱 Scan the QR to connect.");
      }

      if (connection === "open") {
        console.log("✅ Connected!");
        isConnecting = false;

        // Heal missing sessions
        try { await sock.sendPresenceUpdate("available"); } catch {}

        // Load commands and handler
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

      if (connection === "connecting") console.log("🔄 Reconnecting...");
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
