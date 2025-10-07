export const name = "antilink";
export const description = "Enable/disable anti-link (auto-delete invite links, optional kick)";
export const usage = ".antilink on | .antilink off | .antilink kick";
export const adminOnly = true;

// Store antilink settings per group
// Value: "delete" or "kick"
export const antiLinkGroups = new Map();

export async function execute(sock, msg, args) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ This command only works in groups!"
        }, { quoted: msg });
    }

    const groupId = msg.key.remoteJid;
    const option = args[0]?.toLowerCase();

    if (!option || !["on", "off", "kick"].includes(option)) {
        return await sock.sendMessage(groupId, {
            text: `⚙️ *AntiLink Settings*\n\nUsage: ${usage}\n\nExamples:\n• .antilink on (delete only)\n• .antilink kick (delete + kick)\n• .antilink off`
        }, { quoted: msg });
    }

    if (option === "on") {
        antiLinkGroups.set(groupId, "delete");
        await sock.sendMessage(groupId, { text: "✅ AntiLink enabled! Links will be auto-deleted." }, { quoted: msg });
    } else if (option === "kick") {
        antiLinkGroups.set(groupId, "kick");
        await sock.sendMessage(groupId, { text: "✅ AntiLink enabled! Users posting links will be deleted + kicked." }, { quoted: msg });
    } else {
        antiLinkGroups.delete(groupId);
        await sock.sendMessage(groupId, { text: "❌ AntiLink disabled!" }, { quoted: msg });
    }
}

// 🚫 Middleware: check messages for links
export async function handleAntiLink(sock, msg) {
    try {
        if (!msg.message || msg.key.fromMe) return;

        const groupId = msg.key.remoteJid;
        if (!antiLinkGroups.has(groupId)) return;

        const mode = antiLinkGroups.get(groupId);
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            "";

        if (!text) return;

        // Regex for WhatsApp group links
        const linkRegex = /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i;

        if (linkRegex.test(text)) {
            const sender = msg.key.participant;

            // Delete the message
            await sock.sendMessage(groupId, { delete: msg.key });

            if (mode === "kick") {
                try {
                    // Kick the user
                    await sock.groupParticipantsUpdate(groupId, [sender], "remove");

                    await sock.sendMessage(groupId, {
                        text: `🚫 Link detected! ${sender.split("@")[0]} has been removed.`,
                        mentions: [sender]
                    });
                } catch (err) {
                    await sock.sendMessage(groupId, {
                        text: `⚠️ Tried to kick ${sender.split("@")[0]} but failed (am I admin?).`,
                        mentions: [sender]
                    });
                }
            } else {
                // Just warn
                await sock.sendMessage(groupId, {
                    text: `🚫 Link detected! Message deleted.`,
                    mentions: [sender]
                });
            }
        }
    } catch (error) {
        console.error("AntiLink error:", error);
    }
}
