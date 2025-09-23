// commands/gitpull.js
import { exec } from "child_process";
import fs from "fs";

export const name = "gitpull";
export const description = "Pull latest updates from GitHub (Owner only)";
export const ownerOnly = true;

// Normalize numbers
function normalizeNumber(number) {
  return number.replace(/\D/g, "");
}

export async function execute(sock, msg, args) {
  const jid = msg.key.remoteJid;
  const senderNumber = normalizeNumber(msg.key.participant || msg.key.remoteJid);

  // Load owners
  const ownersFile = "./owners.json";
  let OWNERS = ["923219576020", "923440565387"]; // fallback
  if (fs.existsSync(ownersFile)) {
    OWNERS = JSON.parse(fs.readFileSync(ownersFile, "utf-8"));
  }

  const normalizedOwners = OWNERS.map(normalizeNumber);

  if (!normalizedOwners.includes(senderNumber)) {
    return sock.sendMessage(jid, {
      text: "❌ Only bot owners can use this command."
    }, { quoted: msg });
  }

  try {
    // Execute git pull
    exec("git pull origin main", { cwd: "./" }, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Git pull error:", error);
        await sock.sendMessage(jid, { text: `💥 Git pull failed:\n${error.message}` }, { quoted: msg });
        return;
      }

      // Send output
      await sock.sendMessage(jid, { text: `✅ Git pull successful!\n\n${stdout || stderr}` }, { quoted: msg });

      // Optional: restart bot automatically after pull
      exec("node index.js", (err) => {
        if (err) console.error("❌ Restart error:", err);
      });
    });
  } catch (err) {
    console.error("❌ Command execution error:", err);
    await sock.sendMessage(jid, { text: `💥 Error executing git pull: ${err.message}` }, { quoted: msg });
  }
}
