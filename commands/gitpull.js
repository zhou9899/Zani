// gitpull.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Path to owners.json
const ownersFile = path.resolve("./owners.json");

export default {
  name: "gitpull",
  prefix: ".",
  description: "Pull latest updates from GitHub (owner only)",
  execute: async (sock, message) => {
    const sender = message.key?.remoteJid;
    const text = message.message?.conversation || "";

    if (!text.startsWith(".gitpull")) return; // Command trigger

    // Load owners from JSON
    let owners = [];
    try {
      const data = fs.readFileSync(ownersFile, "utf-8");
      owners = JSON.parse(data);
    } catch (err) {
      console.error("Failed to read owners.json:", err);
      await sock.sendMessage(sender, { text: "❌ Could not read owners file." });
      return;
    }

    if (!owners.includes(sender)) {
      await sock.sendMessage(sender, { text: "❌ You are not authorized to run this command." });
      return;
    }

    // Acknowledge command
    await sock.sendMessage(sender, { text: "🔄 Pulling latest code from Git..." });

    // Execute git pull
    exec("git pull origin main", { cwd: path.resolve("./") }, (error, stdout, stderr) => {
      if (error) {
        sock.sendMessage(sender, { text: `❌ Git pull failed:\n${error.message}` });
        return;
      }
      if (stderr) {
        sock.sendMessage(sender, { text: `⚠️ Git pull stderr:\n${stderr}` });
        return;
      }
      sock.sendMessage(sender, { text: `✅ Git pull complete:\n${stdout}` });
    });
  },
};
