export const name = "help";
export const description = "Get help with commands";

export async function execute(sock, msg, commands, prefix) {
    let helpText = "📜 *Help Menu* 📜\n\n";
    for (let cmd in commands) {
        helpText += `🔹 *.${cmd}* - ${commands[cmd].description}\n`;
    }
    await sock.sendMessage(msg.key.remoteJid, { text: helpText });
}
