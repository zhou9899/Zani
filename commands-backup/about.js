export const name = "about";
export const description = "Show bot info";

export async function execute(sock, msg, commands, prefix) {
    const messageText = "🤖 Zhou Bot\nVersion: 1.0.0\nCreated by: You";
    await sock.sendMessage(msg.key.remoteJid, { text: messageText });
}
