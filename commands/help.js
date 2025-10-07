import fs from "fs";
import path from "path";

export const name = "help";
export const description = "Show all commands (help)";

export async function execute(sock, msg, args) {
    const prefix = ".";
    const commands = global.commands || {};
    const jid = msg.key.remoteJid;

    // Load Zani menu image
    const filePath = path.join(process.cwd(), "zani.jpeg");
    const imageBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;

    // Help menu text with Zani personality
    const helpText = `
╔═⭓═══⭓═══⭓═╗
       𝓩𝓐𝓝𝓘  •  BOSS
╚═⭓═══⭓═══⭓═╝

𖤓 Prefix: ${prefix} 
𖤓 Owner: Zhou (My husband, don’t forget it!)

╭─═🌀 FUN COMMANDS 🌀═─╮
┃ “Laugh, or else I will judge you.”
│ ✦ .joke      Tell a joke
│ ✦ .roll      Roll a dice
│ ✦ .fortune   See your fortune
│ ✦ .meme      Random meme
│ ✦ .hug       Hug someone
│ ✦ .kiss      Kiss someone
╰─────────────────────╯

╭─═🛡 UTILITY & INFO 🛡═─╮
┃ “You better read this carefully.”
│ ✦ .help      Show menu
│ ✦ .menu      Show this menu
│ ✦ .weather   Weather info
│ ✦ .profile   Show profile
╰─────────────────────╯

╭─═🎵 MEDIA & MUSIC 🎵═─╮
┃ “No excuses, music now!”
│ ✦ .play      Play a song
╰─────────────────────╯

╭─═💾 DOWNLOADERS 💾═─╮
┃ “Download fast, or I’ll delete it myself.”
│ ✦ .yt        YouTube downloader
│ ✦ .ttk       TikTok downloader
╰─────────────────────╯

╭─═🕹 GAMES & CHALLENGES 🕹═─╮
┃ “Only the brave dare to play.”
│ ✦ .game
│ ✦ .puzzle
│ ✦ .ttt
│ ✦ .wcg
╰─────────────────────╯

╭─═⚔️ ADMIN & MODERATION ⚔️═─╮
┃ “Follow my rules, or face consequences.”
│ ✦ .kick
│ ✦ .delete
│ ✦ .promote
│ ✦ .demote
│ ✦ .hidetag
│ ✦ .open
│ ✦ .close
╰─────────────────────╯

╭─═👑 OWNER COMMANDS 👑═─╮
┃ “Only I can touch these.”
│ ✦ .restart
╰─────────────────────╯
`;

    // Build dynamic menu rows safely for buttons
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

    // Send message
    try {
        await sock.sendMessage(
            jid,
            imageBuffer
                ? {
                      image: imageBuffer,
                      caption: helpText,
                      footer: "🤖 Zani • Zhou",
                      sections,
                      buttonText: "📖 Open Menu",
                      jpegThumbnail: imageBuffer
                  }
                : { text: helpText },
            { quoted: msg }
        );
    } catch (err) {
        console.error("❌ Sending help failed, sending text-only fallback.", err);
        await sock.sendMessage(jid, { text: helpText });
    }
}
