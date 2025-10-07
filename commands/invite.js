export const name = "invite";
export const description = "Get the group invite link";
export const usage = ".invite";
export const adminOnly = true;

export async function execute(sock, msg) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ This command only works in group chats!"
        }, { quoted: msg });
    }

    const groupId = msg.key.remoteJid;

    try {
        // Get group invite code
        const inviteCode = await sock.groupInviteCode(groupId);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await sock.sendMessage(groupId, {
            text: `🔗 *Group Invite Link:*\n\n${inviteLink}`
        }, { quoted: msg });
    } catch (error) {
        console.error("Error fetching invite link:", error);
        await sock.sendMessage(groupId, {
            text: "❌ Failed to get invite link! (Make sure I'm an admin)"
        }, { quoted: msg });
    }
}
