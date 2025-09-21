// commands/delete.js
export const name = "d";
export const description = "Delete messages (Admin only)";
export const adminOnly = true;

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");
    
    if (!isGroup) {
        return sock.sendMessage(jid, { 
            text: "❌ This command only works in groups." 
        }, { quoted: msg });
    }

    try {
        // Check if user is admin
        const groupMetadata = await sock.groupMetadata(jid);
        const participant = msg.key.participant || msg.key.remoteJid;
        const isAdmin = groupMetadata.participants.find(p => p.id === participant)?.admin;

        if (!isAdmin) {
            return sock.sendMessage(jid, { 
                text: "❌ You need to be an admin to use this command." 
            }, { quoted: msg });
        }

        // Check if replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsg?.quotedMessage) {
            return sock.sendMessage(jid, { 
                text: "❌ Reply to a message to delete it. Usage: .d" 
            }, { quoted: msg });
        }

        const quotedMessageKey = {
            remoteJid: jid,
            id: quotedMsg.stanzaId,
            participant: quotedMsg.participant
        };

        // Delete the quoted message
        await sock.sendMessage(jid, {
            delete: quotedMessageKey
        });

        console.log(`✅ Message deleted by admin in group: ${jid}`);

    } catch (err) {
        console.error("❌ Delete command error:", err);
        await sock.sendMessage(jid, { 
            text: "❌ Failed to delete message. Make sure I'm an admin too." 
        }, { quoted: msg });
    }
}
