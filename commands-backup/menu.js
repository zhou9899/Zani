import fs from "fs";
import path from "path";

export const name = "menu";
export const description = "Show all commands";

export async function execute(sock, msg, args) {
    const prefix = ".";
    const commands = global.commands || {};
    const jid = msg.key.remoteJid;

    // Load menu image safely
    const filePath = path.join(process.cwd(), "zani.jpeg");
    const imageBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;

    // Menu text
    const menuText = `
╔════════════════════════════╗
         🌌 Zani 🌌
╠════════════════════════════╣
🛠 Creator : Zhou
📌 Prefix  : ${prefix}
╠════════════════════════════╣
💡 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗠𝗲𝗻𝘂
╠════════════════════════════╣

🎉 • Fun Commands
😂 .joke      → 🤣 Random joke
🎲 .roll      → 🎲 Roll a dice
🃏 .fortune   → 🔮 Get your fortune
🎭 .meme      → 🖼️ Random meme

🛠 • Utility Commands
ℹ️ .help      → 📝 Show this menu
🌐 .weather   → ☁️ Weather info

🎵 • Media & Music
🎶 .play      → 🎵 Play a song

💾 Downloader
.yt  → YouTube video downloader
.ttk → Tiktok video downloader

🕹 • Games
🎮 .game      → 🕹️ Start a mini-game
🧩 .puzzle   → 🧩 Brain teaser

✨ Enjoy & have fun with Zani! ✨
`;

    // Build dynamic menu rows safely
    const rows = [];
    for (let cmd in commands) {
        if (!commands[cmd] || !commands[cmd].execute) continue;
        rows.push({
            title: `${prefix}${cmd}`,
            description: commands[cmd].description || "No description",
            rowId: `${prefix}${cmd}`
        });
    }

    const sections = [{ title: "📋 Available Commands", rows }];

    // Send menu
    try {
        await sock.sendMessage(
            jid,
            imageBuffer
                ? {
                      image: imageBuffer,
                      caption: menuText,
                      footer: "🤖 Zani • Zhou",
                      sections,
                      buttonText: "📖 Open Menu",
                      jpegThumbnail: imageBuffer || undefined
                  }
                : { text: menuText },
            { quoted: msg }
        );
    } catch (err) {
        console.error("❌ Sending menu failed, sending text-only fallback.", err);
        await sock.sendMessage(jid, { text: menuText });
    }
}
