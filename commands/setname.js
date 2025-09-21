// commands/setname.js
import { normalizeNumber, updateProfile, loadUsers, saveUsers } from "../helpers/ai.js";
import fs from "fs";
import path from "path";

export const name = "setname";
export const description = "Set your name. Owner can set others with: .setname <number|@mention> <name>";

const userDbPath = path.join(process.cwd(), "data", "user-db.json");

function readUsers() { try { return JSON.parse(fs.readFileSync(userDbPath, "utf8") || "{}"); } catch { return {}; } }
function writeUsers(u) { fs.writeFileSync(userDbPath, JSON.stringify(u, null, 2)); }

export async function execute(sock, msg, args) {
  try {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Usage: .setname <number|@mention> <name> OR .setname <name> (for yourself)" }, { quoted: msg });

    // If first arg is a number or mention, and there's >1 arg -> target
    let possibleTarget = args[0];
    let targetNumber = null;
    let nameParts = [];

    if (possibleTarget.includes("@") || /\d/.test(possibleTarget) && args.length > 1) {
      // Owner-only for setting others
      const normalizedOwners = (global.owners || []).map(o => normalizeNumber(String(o)));
      const sender = (msg.key.participant || msg.key.remoteJid).split("@")[0].replace(/\D/g, "");
      const isOwner = normalizedOwners.includes(sender);
      if (!isOwner) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Only owner can set others' names." }, { quoted: msg });

      // resolve mentioned or numeric target
      targetNumber = possibleTarget.includes("@") ? possibleTarget.split("@")[0].replace(/\D/g, "") : possibleTarget.replace(/\D/g, "");
      nameParts = args.slice(1);
    } else {
      // setting own name
      targetNumber = (msg.key.participant || msg.key.remoteJid).split("@")[0].replace(/\D/g, "");
      nameParts = args;
    }

    const newName = nameParts.join(" ").trim();
    if (!newName) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Provide a valid name." }, { quoted: msg });

    // Update DB
    const users = readUsers();
    if (!users[targetNumber]) users[targetNumber] = { number: targetNumber, name: newName, created: Date.now() };
    else users[targetNumber].name = newName;
    writeUsers(users);

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Name set: ${newName} (${targetNumber})` }, { quoted: msg });
  } catch (e) {
    console.error("setname error:", e);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error setting name.` }, { quoted: msg });
  }
}
