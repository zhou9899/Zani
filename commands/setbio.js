// commands/setbio.js
import fs from "fs";
import path from "path";

const userDbPath = path.join(process.cwd(), "data", "user-db.json");
function readUsers() { try { return JSON.parse(fs.readFileSync(userDbPath, "utf8") || "{}"); } catch { return {}; } }
function writeUsers(u) { fs.writeFileSync(userDbPath, JSON.stringify(u, null, 2)); }

export const name = "setbio";
export const description = "Set your bio";

export async function execute(sock, msg, args) {
  try {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Usage: .setbio <your bio text>" }, { quoted: msg });
    }
    const bio = args.join(" ").trim();
    const number = (msg.key.participant || msg.key.remoteJid).split("@")[0].replace(/\D/g, "");
    const users = readUsers();
    if (!users[number]) users[number] = { number, created: Date.now() };
    users[number].bio = bio;
    writeUsers(users);

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Bio updated: ${bio}` }, { quoted: msg });
  } catch (e) {
    console.error("setbio error:", e);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error setting bio." }, { quoted: msg });
  }
}
