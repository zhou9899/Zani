import fs from "fs";
import path from "path";

export const name = "menu";
export const description = "Show all commands";

export async function execute(sock, msg, args) {
    const prefix = ".";
    const commands = global.commands || {};
    const jid = msg.key.remoteJid;

    // Excluded commands
    const excluded = [
        "debug", "anal", "pussy", "milf", "whatsappinfo",
        "setbio", "setage", "examplegame", "gitpull"
    ];

    // Load menu image
    const filePath = path.join(process.cwd(), "zani.jpeg");
    const imageBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;

    const menuText = `
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
│ ✦ .pat       Pat someone
│ ✦ .neko      Random neko
│ ✦ .waifu     Random waifu
│ ✦ .husbando  Random husbando
│ ✦ .kitsune   Random kitsune
│ ✦ .megumin   Random Megumin
│ ✦ .shinobu   Random Shinobu
│ ✦ .yuri      Random Yuri
│ ✦ .hentai    Random Hentai
╰─────────────────────╯

╭─═🛡 UTILITY & INFO 🛡═─╮
┃ “You better read this carefully.”
│ ✦ .help      Show menu
│ ✦ .menu      Show this menu
│ ✦ .weather   Weather info
│ ✦ .profile   Show profile
│ ✦ .status    Bot status
│ ✦ .about     About bot
╰─────────────────────╯

╭─═🎵 MEDIA & MUSIC 🎵═─╮
┃ “No excuses, music now!”
│ ✦ .play      Play a song
│ ✦ .mem       Meme image
│ ✦ .vv        View once
│ ✦ .ws        WhatsApp sticker
╰─────────────────────╯

╭─═💾 DOWNLOADERS 💾═─╮
┃ “Download fast, or I’ll delete it myself.”
│ ✦ .yt        YouTube downloader
│ ✦ .ttk       TikTok downloader
│ ✦ .ig        Instagram downloader
╰─────────────────────╯

╭─═🕹 GAMES & CHALLENGES 🕹═─╮
┃ “Only the brave dare to play.”
│ ✦ .game
│ ✦ .puzzle
│ ✦ .ttt       Tic Tac Toe
│ ✦ .wcg       Word Challenge
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
│ ✦ .op        Debug group ops
│ ✦ .setwelcome
│ ✦ .setleave
╰─────────────────────╯

╭─═👑 OWNER COMMANDS 👑═─╮
┃ “Only I can touch these.”
│ ✦ .restart
│ ✦ .addowner
│ ✦ .removeowner
│ ✦ .addmod
│ ✦ .removemod
│ ✦ .mods
│ ✦ .owners
╰─────────────────────╯

╭─═🔞 NSFW 🔞═─╮
┃ “For 18+ only, don’t blame me later.”
│ ✦ .nsfw      Random NSFW
╰─────────────────────╯
`;

    // Build dynamic menu rows (filtered)
    const rows = [];
    for (let cmd in commands) {
        if (!commands[cmd] || !commands[cmd].execute) continue;
        if (excluded.includes(cmd.toLowerCase())) continue;
        rows.push({
            title: `${prefix}${cmd}`,
            description: commands[cmd].description || "No description",
            rowId: `${prefix}${cmd}`
        });
    }

    const sections = [{ title: "📋 Available Commands", rows }];

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
                      jpegThumbnail: imageBuffer
                  }
                : { text: menuText },
            { quoted: msg }
        );
    } catch (err) {
        console.error("❌ Sending menu failed, sending text-only fallback.", err);
        await sock.sendMessage(jid, { text: menuText });
    }
}
