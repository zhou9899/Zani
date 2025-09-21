// commands/op.js - FIXED WITH LID
export const name = "op";
export const description = "Promote yourself to admin (Bot Owner only)";
export const ownerOnly = true;

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");

    if (!isGroup) {
        return sock.sendMessage(jid, {
            text: "❌ This command only works in groups."
        }, { quoted: msg });
    }

    try {
        // FIXED: Use LID comparison instead of phone number
        const senderLid = msg.key.participant?.split('@')[0];
        const botOwnerLid = "253235986227401"; // Your LID

        if (senderLid !== botOwnerLid) {
            return sock.sendMessage(jid, {
                text: "❌ This command is only for my owner."
            }, { quoted: msg });
        }

        // Get the user's JID (yourself)
        const targetUser = msg.key.participant || msg.key.remoteJid;

        // Try to promote with better error handling
        await sock.groupParticipantsUpdate(jid, [targetUser], "promote");

        await sock.sendMessage(jid, {
            text: `⭐ You have been promoted to admin!`
        });
        console.log(`✅ Owner promoted themselves in: ${jid}`);

    } catch (err) {
        console.error("❌ OP command error:", err.message);
        
        if (err.message.includes('not authorized')) {
            await sock.sendMessage(jid, {
                text: "❌ I need to be an admin first to promote you!"
            }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, {
                text: `❌ Failed to promote: ${err.message}`
            }, { quoted: msg });
        }
    }
}
