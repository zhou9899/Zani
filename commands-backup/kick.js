// commands/kick.js

export const name = "kick";
export const description = "Remove a member from the group";

export async function execute(sock, m, args) {
    const from = m.key.remoteJid;

    // ❌ Only works in groups
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ This command works only in groups." });
    }

    // Get group metadata
    let metadata;
    try {
        metadata = await sock.groupMetadata(from);
    } catch (err) {
        console.error("❌ Failed to fetch group metadata:", err);
        return sock.sendMessage(from, { text: "❌ Could not get group info." });
    }

    // Debug logs
    console.log("🔎 Group Participants:", metadata.participants.map(p => p.jid));
    console.log("🤖 Bot ID:", sock.user.id);

    // Check if bot is in group
    const botNumber = sock.user.id.split(":")[0]; // e.g., 923219576020
    const botInGroup = metadata.participants.find(p => p.jid.split("@")[0] === botNumber);

    if (!botInGroup) {
        return sock.sendMessage(from, { text: "❌ I am not in this group!" });
    }

    // Check if bot is admin
    const isBotAdmin = botInGroup.admin !== null && botInGroup.admin !== undefined;
    if (!isBotAdmin) {
        return sock.sendMessage(from, { text: "❌ I need to be *admin* to kick members." });
    }

    // Determine target to kick
    let target;
    const ctx = m.message?.extendedTextMessage?.contextInfo;

    if (ctx?.mentionedJid?.length) {
        target = ctx.mentionedJid[0];
    } else if (ctx?.participant) {
        target = ctx.participant;
    } else if (args[0]) {
        let number = args[0].replace(/[^0-9]/g, "");
        target = number + "@s.whatsapp.net";
    }

    if (!target) {
        return sock.sendMessage(from, { text: "⚠️ Reply, mention, or provide a number to kick." });
    }

    // ❌ Prevent kicking yourself
    if (target === botInGroup.jid) {
        return sock.sendMessage(from, { text: "⚠️ I cannot kick myself!" });
    }

    // ❌ Prevent kicking group owner (optional)
    const owner = metadata.owner?.split("@")[0];
    if (target.split("@")[0] === owner) {
        return sock.sendMessage(from, { text: "⚠️ Cannot kick the group owner!" });
    }

    // Attempt to kick
    try {
        await sock.groupParticipantsUpdate(from, [target], "remove");
        await sock.sendMessage(from, { 
            text: `✅ Removed @${target.split("@")[0]}`, 
            mentions: [target] 
        });
        console.log(`✅ Kicked member: ${target}`);
    } catch (e) {
        await sock.sendMessage(from, { 
            text: `❌ Failed to kick @${target.split("@")[0]}`, 
            mentions: [target] 
        });
        console.error("Kick error:", e);
    }
}
