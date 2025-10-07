// commands/chat.js
import fs from "fs";
import path from "path";

export const name = "chat";
export const description = "Enable or disable Zani AI chat";

export async function execute(sock, msg, args) {
    const configPath = path.join(process.cwd(), "helpers", "config.json");

    // Load current config
    let config = { chatEnabled: true };
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    if (!args[0]) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: `Usage: .chat on / .chat off\nCurrent: ${config.chatEnabled ? "ON" : "OFF"}`
        });
    }

    const command = args[0].toLowerCase();
    if (command === "on") {
        config.chatEnabled = true;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        global.chatEnabled = true;
        await sock.sendMessage(msg.key.remoteJid, { text: "✅ AI chat enabled." });
    } else if (command === "off") {
        config.chatEnabled = false;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        global.chatEnabled = false;
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ AI chat disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ Invalid option. Use: on / off" });
    }
}
