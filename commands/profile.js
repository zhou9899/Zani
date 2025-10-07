// commands/profile.js
import fs from "fs";
import path from "path";
import { getRealNumber, isRegistered } from "../helpers/ai.js";

const profilesFile = path.join(process.cwd(), "profiles.json");

// Ensure file exists
if (!fs.existsSync(profilesFile)) fs.writeFileSync(profilesFile, "{}");

function loadProfiles() {
  return JSON.parse(fs.readFileSync(profilesFile, "utf8"));
}

function saveProfiles(data) {
  fs.writeFileSync(profilesFile, JSON.stringify(data, null, 2));
}

export default {
  name: "profile",
  description: "View or set your profile info",
  async execute(sock, msg, args) {
    // ------------------ Extract IDs ------------------
    const internalId = (msg.key.participant || msg.key.remoteJid).split("@")[0].replace(/\D/g, "");
    const profiles = loadProfiles();

    // ------------------ Set Profile ------------------
    if (args[0] === "set") {
      const field = args[1];
      const value = args.slice(2).join(" ");
      if (!field || !value) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "Usage: .profile set <name|age|bio> <value>" },
          { quoted: msg }
        );
      }

      if (!profiles[internalId]) profiles[internalId] = { name: "", age: "", bio: "" };
      profiles[internalId][field] = value;
      saveProfiles(profiles);

      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `✅ ${field} updated to: ${value}` },
        { quoted: msg }
      );
    }

    // ------------------ Show Profile ------------------
    if (!isRegistered(internalId)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ You are not registered! Use: .register YOUR_NUMBER" },
        { quoted: msg }
      );
    }

    const realNumber = getRealNumber(internalId);
    const userProfile = profiles[internalId] || { name: "Unknown", age: "N/A", bio: "No bio set" };

    // Fetch PFP
    let pfpUrl;
    try {
      pfpUrl = await sock.profilePictureUrl(msg.key.participant || msg.key.remoteJid, "image");
    } catch {
      try {
        pfpUrl = await sock.profilePictureUrl(sock.user.id, "image"); // bot pfp fallback
      } catch {
        pfpUrl = null;
      }
    }

    // ------------------ Styled ASCII Profile ------------------
    const profileText = `
=====================
      👤 PROFILE
=====================
📛 ${userProfile.name || "Unknown"}
🎂 ${userProfile.age || "N/A"}
📝 ${userProfile.bio || "No bio set"}
📱 +${realNumber}
=====================
    `.trim();

    if (pfpUrl) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { image: { url: pfpUrl }, caption: profileText },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: profileText }, { quoted: msg });
    }
  },
};

