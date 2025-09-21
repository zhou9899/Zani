// commands/setage.js
import fs from "fs";
import path from "path";

const userDbPath = path.join(process.cwd(), "data", "user-db.json");
function readUsers() { try { return JSON.parse(fs.readFileSync(userDbPath, "utf8") || "{}"); } catch { return {}; } }
function writeUsers(u) { fs.writeFileSync(userDbPath, JSON.stringify(u, null, 2)); }

export const name = "setage";
export const description = "Set your age";

export async function execute(sock, msg, args) {
  try {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Usage: .setage <number>" }, { quoted: msg });
    }
    const age = parseInt(args[0], 10);
    if (isNaN(age) || age < 0 || age > 120) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Enter a valid age (0-120)." }, { quoted: msg });
    }

    const number = (msg.key.participant || msg.key.remoteJid).split("@")[0].replace(/\D/g, "");
    const users = readUsers();
    if (!users[number]) users[number] = { number, created: Date.now() };
    users[number].age = age;
    writeUsers(users);

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Age updated: ${age}` }, { quoted: msg });
  } catch (e) {
    console.error("setage error:", e);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error setting age." }, { quoted: msg });
  }
}
