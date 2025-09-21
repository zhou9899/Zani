export const name = "hidetag";
export const description = "Send a message tagging all members (hidden tag) (Admins only)";

export async function execute(sock, m, args) {
    const from = m.key.remoteJid;

    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Group only." });
    }

    const metadata = await sock.groupMetadata(from);
    const senderId = m.key.participant || m.key.remoteJid;
    const admins = metadata.participants.filter(p => p.admin).map(p => p.id);

    if (!admins.includes(senderId)) {
        return sock.sendMessage(from, { text: "❌ Only admins can use this command." });
    }

    // Text to send
    const message = args.length > 0 ? args.join(" ") : "👋";

    // Send hidetag message
    await sock.sendMessage(from, {
        text: message,
        mentions: metadata.participants.map(p => p.id)
    });

    // ✅ Delete the original command message
    try {
        await sock.sendMessage(from, {
            delete: m.key
        });
    } catch (err) {
        console.error("Failed to delete command message:", err);
    }
}
