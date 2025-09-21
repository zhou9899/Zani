// commands/op.js - IMPROVED WITH BETTER ERROR HANDLING
export const name = "op";
export const description = "Promote yourself to admin (Owner only)";
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
        // Check if user is the bot owner
        const senderLid = msg.key.participant?.split('@')[0];
        const botOwnerLid = "253235986227401";

        if (senderLid !== botOwnerLid) {
            return sock.sendMessage(jid, {
                text: "❌ This command is only for my owner."
            }, { quoted: msg });
        }

        // Get the user's JID
        const targetUser = msg.key.participant || msg.key.remoteJid;

        // Try to promote
        await sock.groupParticipantsUpdate(jid, [targetUser], "promote");

        await sock.sendMessage(jid, {
            text: `⭐ You have been promoted to admin!`
        });
        console.log(`✅ Owner promoted themselves in: ${jid}`);

    } catch (err) {
        console.error("❌ OP command error:", err.message);
        
        // SPECIFIC ERROR HANDLING
        if (err.message.includes('forbidden') || err.message.includes('403')) {
            await sock.sendMessage(jid, {
                text: "❌ *FORBIDDEN*\n\nI cannot promote you in this group due to:\n\n" +
                      "• 🤖 I may not be an admin\n" +
                      "• ⚙️ Group settings restrict promotions\n" + 
                      "• 🚫 WhatsApp limitations in this group\n\n" +
                      "_Try in a different group or make me admin first._"
            }, { quoted: msg });
        }
        else if (err.message.includes('not authorized') || err.message.includes('admin')) {
            await sock.sendMessage(jid, {
                text: "❌ I need to be an admin first to promote you!\n\n_Please make me an admin in this group._ ⚡"
            }, { quoted: msg });
        }
        else {
            await sock.sendMessage(jid, {
                text: `❌ Failed to promote: ${err.message}`
            }, { quoted: msg });
        }
    }
}
