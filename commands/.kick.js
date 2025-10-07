export const name = "kick";
export const description = "Remove a member from the group";

export async function execute(sock, m, args) {
    if (!m.key.remoteJid.endsWith("@g.us")) {
        return sock.sendMessage(m.key.remoteJid, { text: "❌ Group only." });
    }

    const metadata = await sock.groupMetadata(m.key.remoteJid);
    const botNumber = await sock.decodeJid(sock.user.id);
    const isBotAdmin = metadata.participants.find(p => p.id === botNumber)?.admin;

    if (!isBotAdmin) {
        return sock.sendMessage(m.key.remoteJid, { text: "❌ I need to be admin to kick users." });
    }

    let target;
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
    } else {
        return sock.sendMessage(m.key.remoteJid, { text: "⚠️ Reply or mention someone to kick." });
    }

    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Removed @${target.split("@")[0]}`, mentions: [target] });
}
