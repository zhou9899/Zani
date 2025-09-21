export const name = "demote";
export const description = "Demote a user from admin";

export async function execute(sock, msg, args) {
    if (!msg.key.remoteJid.endsWith("@g.us")) return;

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const user = (mentioned && mentioned[0]) || args[0];

    if (!user) return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Tag someone or provide number." });

    try {
        await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "demote");
        await sock.sendMessage(msg.key.remoteJid, { text: "✅ Demoted!" });
    } catch (err) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Failed: ${err.message}` });
    }
}
