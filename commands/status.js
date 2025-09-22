// commands/status.js
import os from "os";
import process from "process";

export const name = "status";
export const description = "Check bot uptime, RAM, and CPU usage";
export const ownerOnly = false;

function formatBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    try {
        const uptime = process.uptime(); // seconds
        const ramUsed = process.memoryUsage().rss; // bytes
        const totalRam = os.totalmem();
        const cpuLoad = os.loadavg()[0]; // 1-minute load avg

        const uptimeH = Math.floor(uptime / 3600);
        const uptimeM = Math.floor((uptime % 3600) / 60);
        const uptimeS = Math.floor(uptime % 60);

        const text = `📊 *Bot Status*
🕒 Uptime: ${uptimeH}h ${uptimeM}m ${uptimeS}s
💾 RAM Used: ${formatBytes(ramUsed)} / ${formatBytes(totalRam)}
⚡ CPU Load (1 min avg): ${cpuLoad.toFixed(2)}`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    } catch (err) {
        console.error("Status command error:", err);
        await sock.sendMessage(jid, { text: "❌ Failed to get bot status" }, { quoted: msg });
    }
}
