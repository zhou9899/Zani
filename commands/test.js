export const name = "test";
export const description = "Check bot latency (ms)";

export async function execute(sock, msg) {
    const start = Date.now();
    const userJid = msg.key.participant || msg.key.remoteJid;

    // Send initial message with reply
    await sock.sendMessage(msg.key.remoteJid, {
        text: "Hmm?",
        mentions: [userJid]
    }, { quoted: msg }); // ← ADD THIS to reply to the user

    const end = Date.now();
    const latency = end - start;

    // Send the result as a NEW message (editing doesn't work in WhatsApp)
    await sock.sendMessage(msg.key.remoteJid, {
        text: `Hmm?\n> ${latency}ms`,
        mentions: [userJid]
    }, { quoted: msg }); // ← REPLY to the same user
}
