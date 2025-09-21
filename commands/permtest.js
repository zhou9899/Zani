// commands/permtest.js

export const name = "permtest";
export const description = "Self-test of owner/moderator permissions (Owner only)";
export const ownerOnly = true; // Only owners can run this

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split("@")[0];

    // Owner check
    if (!(global.owners || []).includes(senderNumber)) {
        return await sock.sendMessage(jid, {
            text: "❌ Only bot owners can run this test."
        }, { quoted: msg });
    }

    let report = "🛡️ Permission Test Report\n\n";

    // Owners
    const owners = global.owners || [];
    report += `👑 Owners:\n${owners.length ? owners.map(o => `┃ @${o}`).join("\n") : "None"}\n\n`;

    // Moderators
    const mods = global.moderators || [];
    report += `🛡️ Moderators:\n${mods.length ? mods.map(m => `┃ @${m}`).join("\n") : "None"}\n\n`;

    // Test permission checks
    report += "🔍 Permission Checks:\n";
    for (const o of owners) {
        report += `👑 Owner ${o}: ✅ OK\n`;
    }
    for (const m of mods) {
        report += `🛡️ Mod ${m}: ✅ OK\n`;
    }

    // Mentions
    const mentions = [...owners, ...mods].map(n => `${n}@s.whatsapp.net`);

    await sock.sendMessage(jid, { text: report, mentions }, { quoted: msg });
}
