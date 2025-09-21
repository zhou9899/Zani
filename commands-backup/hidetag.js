export const name = "hidetag";
export const description = "Send a message tagging all members (hidden tag)";

export async function execute(sock, m, args) {
    const from = m.key.remoteJid;

    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Group only." });
    }

    const metadata = await sock.groupMetadata(from);
    const participants = metadata.participants.map(p => p.id);

    // Text to send
    const message = args.length > 0 ? args.join(" ") : "👋";

    // Send hidetag message
    await sock.sendMessage(from, {
        text: message,
        mentions: participants
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
