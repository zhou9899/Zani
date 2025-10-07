// commands/groupdebug.js
export const name = "groupdebug";
export const description = "Debug group creation issues";

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    
    try {
        // Test 1: Check current group
        if (jid.endsWith('@g.us')) {
            const metadata = await sock.groupMetadata(jid);
            let info = `🔍 Current Group Analysis:\n`;
            info += `Group ID: ${metadata.id}\n`;
            info += `Subject: ${metadata.subject || 'No subject'}\n`;
            info += `Participants: ${metadata.participants.length}\n\n`;
            
            info += `Participant JIDs:\n`;
            metadata.participants.forEach((p, i) => {
                const type = p.id.endsWith('@lid') ? 'LINKEDIN' : 'WHATSAPP';
                info += `${i+1}. ${p.id} (${type}, admin: ${p.admin})\n`;
            });
            
            await sock.sendMessage(jid, { text: info });
            return;
        }

        // Test 2: Create a test group
        await sock.sendMessage(jid, { text: "🔄 Creating test group..." });
        
        const group = await sock.groupCreate("🤖 BOT TEST GROUP", [
            '923440565387@s.whatsapp.net' // Your number
        ]);
        
        // Check the new group
        const metadata = await sock.groupMetadata(group.id);
        let analysis = `✅ New Group Created:\n`;
        analysis += `ID: ${group.id}\n`;
        analysis += `Participants: ${metadata.participants.length}\n\n`;
        
        analysis += `Participant Analysis:\n`;
        metadata.participants.forEach((p, i) => {
            const type = p.id.endsWith('@lid') ? 'LINKEDIN' : 'WHATSAPP';
            analysis += `${i+1}. ${p.id} (${type}, admin: ${p.admin})\n`;
        });

        await sock.sendMessage(jid, { text: analysis });
        
        // Test 3: Send message in new group
        await sock.sendMessage(group.id, { 
            text: "🤖 Hello! This is a test message from the bot in the new group." 
        });

    } catch (err) {
        console.error("Group debug error:", err);
        await sock.sendMessage(jid, { 
            text: `❌ Debug failed: ${err.message}` 
        }, { quoted: msg });
    }
}
