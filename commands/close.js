// commands/close.js - USING BAILEYS BUILT-IN CHECK
export const name = "close";
export const description = "Close group (admins only)";
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
        // Use Baileys built-in group metadata with better participant handling
        const groupMetadata = await sock.groupMetadata(jid);
        
        // Check if sender is admin using Baileys' participant data
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        
        if (!senderParticipant || (senderParticipant.admin !== "admin" && senderParticipant.admin !== "superadmin")) {
            return sock.sendMessage(jid, { 
                text: "❌ You need to be an admin to close the group." 
            }, { quoted: msg });
        }

        // Try to close the group - let WhatsApp handle the bot admin check
        await sock.groupSettingUpdate(jid, 'announcement');
        
        await sock.sendMessage(jid, { 
            text: "🔒 Group closed! Only admins can send messages now." 
        });
        console.log(`✅ Group closed by admin: ${jid}`);

    } catch (err) {
        console.error("❌ Close command error:", err);
        
        if (err.message.includes('not authorized') || err.message.includes('admin')) {
            await sock.sendMessage(jid, { 
                text: "❌ Failed! Make sure I'm added as an admin in the group." 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { 
                text: "❌ Error: " + err.message 
            }, { quoted: msg });
        }
    }
}

