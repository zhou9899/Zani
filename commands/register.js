// commands/register.js
import { registerUser, getRealNumber } from "../helpers/ai.js";

export const name = "register";
export const description = "Register your real WhatsApp number";

export async function execute(sock, msg, args) {
    const internalId = (msg.key.participant || msg.key.remoteJid).split('@')[0].replace(/\D/g, '');
    const realNumber = args[0]?.replace(/\D/g, '');

    if (!realNumber) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: `📝 Usage: .register YOUR_REAL_NUMBER\nExample: .register 923440565387`
        }, { quoted: msg });
    }

    if (realNumber.length < 10) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Invalid number. Provide your full WhatsApp number.`
        }, { quoted: msg });
    }

    registerUser(internalId, realNumber);

    await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Registered successfully!\n📱 Internal ID: ${internalId}\n🔢 Your number: ${getRealNumber(internalId)}`
    }, { quoted: msg });
}
