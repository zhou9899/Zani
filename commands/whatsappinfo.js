// commands/whatsappinfo.js
export const name = "whatsappinfo";
export const description = "Check WhatsApp version and settings";

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    
    try {
        // Get WhatsApp info from the connection
        const state = sock.authState.creds;
        let info = `📱 WhatsApp Connection Info:\n`;
        info += `Platform: ${state.platform || 'Unknown'}\n`;
        info += `Account Type: ${state.account?.type || 'Personal'}\n`;
        info += `Business: ${state.account?.business || 'No'}\n`;
        info += `LinkedIn: ${state.account?.linkedin ? 'Yes' : 'No'}\n`;
        info += `Registered: ${state.registered ? 'Yes' : 'No'}\n`;
        info += `Phone: ${state.me?.id || 'Unknown'}\n`;
        
        await sock.sendMessage(jid, { text: info });
        
    } catch (err) {
        await sock.sendMessage(jid, { 
            text: `❌ Failed to get info: ${err.message}` 
        }, { quoted: msg });
    }
}
