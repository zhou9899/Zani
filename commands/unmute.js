import { mutedUsers } from './mute.js';

export const name = "unmute";
export const description = "Unmute a user";
export const usage = ".unmute @user";
export const adminOnly = true;

export async function execute(sock, msg, args) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ This command only works in group chats!"
        }, { quoted: msg });
    }

    const groupId = msg.key.remoteJid;

    let userToUnmute = null;
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentionedJid && mentionedJid.length > 0) {
        userToUnmute = mentionedJid[0];
    } else if (quotedSender) {
        userToUnmute = quotedSender;
    }

    if (!userToUnmute) {
        return await sock.sendMessage(groupId, {
            text: `🔊 *Unmute User*\n\nUsage: ${usage}\n\nExamples:\n• .unmute @user\n• Reply + .unmute`
        }, { quoted: msg });
    }

    // Remove from muted users
    if (mutedUsers.has(groupId) && mutedUsers.get(groupId).has(userToUnmute)) {
        mutedUsers.get(groupId).delete(userToUnmute);
        
        // Clean up empty group entries
        if (mutedUsers.get(groupId).size === 0) {
            mutedUsers.delete(groupId);
        }
        
        const userName = await getUserName(sock, userToUnmute);
        
        await sock.sendMessage(groupId, {
            text: `🔊 ${userName} unmuted!`,
            mentions: [userToUnmute]
        });
    } else {
        await sock.sendMessage(groupId, {
            text: "❌ User is not muted!"
        }, { quoted: msg });
    }
}

async function getUserName(sock, userJid) {
    try {
        const contact = await sock.getContact(userJid);
        return contact?.notify || contact?.name || contact?.pushname || 'User';
    } catch (error) {
        return 'User';
    }
}
