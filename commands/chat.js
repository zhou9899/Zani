import fs from 'fs';
import path from 'path';

export const name = "chat";
export const description = "Enable or disable AI chat";
export const ownerOnly = true; // Only bot owners can use this command
export const groupOnly = false; // Works in both groups and DMs
export const adminOnly = false; // Doesn't require group admin (ownerOnly takes precedence)

// Load config if exists
const configPath = path.join(process.cwd(), 'chat-config.json');
let chatConfig = { enabled: true };

try {
    if (fs.existsSync(configPath)) {
        chatConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        global.chatEnabled = chatConfig.enabled;
        console.log('✅ Loaded chat config:', chatConfig.enabled ? 'ENABLED' : 'DISABLED');
    } else {
        // Create default config file
        fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
        global.chatEnabled = true;
        console.log('📁 Created default chat config');
    }
} catch (error) {
    console.error('❌ Error loading chat config:', error);
    global.chatEnabled = true; // Default to enabled on error
}

export async function execute(sock, msg, args) {
    const command = args[0]?.toLowerCase();

    if (!command) {
        const status = global.chatEnabled ? "ON ✅" : "OFF ❌";
        const explanation = global.chatEnabled 
            ? "I'll respond to mentions, replies, and name triggers" 
            : "I'll only respond to commands";
        
        return sock.sendMessage(msg.key.remoteJid, {
            text: `🤖 CHAT MODE: ${status}\n${explanation}\n\nUse: .chat on / .chat off`
        }, { quoted: msg });
    }

    if (command === "on") {
        global.chatEnabled = true;
        chatConfig.enabled = true;
        
        try {
            fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
            await sock.sendMessage(msg.key.remoteJid, {
                text: "✅ AI chat enabled. I'll respond when mentioned, replied to, or when my name is mentioned."
            }, { quoted: msg });
            console.log('✅ Chat enabled by owner');
        } catch (error) {
            console.error('❌ Error saving chat config:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: "✅ Chat enabled but failed to save setting (check console)"
            }, { quoted: msg });
        }
        
    } else if (command === "off") {
        global.chatEnabled = false;
        chatConfig.enabled = false;
        
        try {
            fs.writeFileSync(configPath, JSON.stringify(chatConfig, null, 2));
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ AI chat disabled. I'll only respond to commands."
            }, { quoted: msg });
            console.log('❌ Chat disabled by owner');
        } catch (error) {
            console.error('❌ Error saving chat config:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ Chat disabled but failed to save setting (check console)"
            }, { quoted: msg });
        }
        
    } else if (command === "status") {
        const status = global.chatEnabled ? "ENABLED ✅" : "DISABLED ❌";
        await sock.sendMessage(msg.key.remoteJid, {
            text: `📊 Chat mode is currently: ${status}`
        }, { quoted: msg });
        
    } else {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Invalid option. Use: .chat on / .chat off / .chat status"
        }, { quoted: msg });
    }
}
