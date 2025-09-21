export const name = "hidetag";
export const description = "Send a message tagging all members (hidden tag)";

export async function execute(sock, m, args) {
    if (!m.key.remoteJid.endsWith("@g.us")) {
        return sock.sendMessage(m.key.remoteJid, { text: "❌ Group only." });
    }

    const metadata = await sock.groupMetadata(m.key.remoteJid);
    const participants = metadata.participants.map(p => p.id);

    const message = args.length > 0 ? args.join(" ") : "👋";

    await sock.sendMessage(m.key.remoteJid, {
        text: message,
        mentions: participants
    });
}
