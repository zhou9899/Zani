// commands/debug.js
export const name = "debug";
export const description = "Debug group information";

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");
    
    if (!isGroup) {
        return sock.sendMessage(jid, { 
            text: "❌ This command only works in groups." 
        }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(jid);
        
        let debugInfo = `🔍 Group Debug Information:\n`;
        debugInfo += `Group JID: ${jid}\n`;
        debugInfo += `Bot JID: ${sock.user.id}\n`;
        debugInfo += `Participants: ${groupMetadata.participants.length}\n\n`;
        
        debugInfo += `Participants list:\n`;
        groupMetadata.participants.forEach((p, index) => {
            debugInfo += `${index + 1}. ${p.id} (admin: ${p.admin})\n`;
        });

        // Check if bot is in participants
        const botParticipant = groupMetadata.participants.find(p => 
            p.id === sock.user.id || 
            p.id.includes(sock.user.id.split(':')[0])
        );
        
        debugInfo += `\nBot found: ${!!botParticipant}\n`;
        if (botParticipant) {
            debugInfo += `Bot admin status: ${botParticipant.admin}\n`;
        }

        await sock.sendMessage(jid, { text: debugInfo });

    } catch (err) {
        console.error("❌ Debug command error:", err);
        await sock.sendMessage(jid, { 
            text: "❌ Debug failed: " + err.message 
        }, { quoted: msg });
    }
}
