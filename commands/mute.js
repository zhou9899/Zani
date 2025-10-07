export const name = "mute";
export const description = "Auto-delete messages from muted users (silent)";
export const usage = ".mute @user [time] | .mute 30s | .mute 5m | .mute 1h | .mute 2d";
export const adminOnly = true;

// Exported so unmute.js & mutelist.js can use the same map
export const mutedUsers = new Map();

export async function execute(sock, msg, args) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ This command only works in group chats!"
        }, { quoted: msg });
    }

    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Check if user is admin/mod/owner
    const isAuthorized = await isUserAuthorized(sock, groupId, sender);
    if (!isAuthorized) {
        return await sock.sendMessage(groupId, {
            text: "❌ Only admins, moderators, and owners can use this command!"
        }, { quoted: msg });
    }

    let userToMute = null;
    let muteTime = 3600; // Default 1 hour

    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentionedJid && mentionedJid.length > 0) {
        userToMute = mentionedJid[0];
    } else if (quotedSender) {
        userToMute = quotedSender;
    }

    if (!userToMute) {
        return await sock.sendMessage(groupId, {
            text: `🔇 *Mute User*\n\nUsage: ${usage}\n\nExamples:\n• .mute @user 1s\n• .mute @user 30s\n• .mute @user 5m\n• .mute @user 1h\n• .mute @user 2d\n• Reply + .mute 10s`
        }, { quoted: msg });
    }

    try {
        // Parse mute duration
        for (let i = 0; i < args.length; i++) {
            const parsedTime = parseTime(args[i].toLowerCase());
            if (parsedTime !== null) {
                muteTime = parsedTime;
                break;
            }
        }

        // Prevent muting self
        if (userToMute === sender) {
            return await sock.sendMessage(groupId, { text: "❌ You cannot mute yourself!" }, { quoted: msg });
        }

        // Prevent muting admins
        const targetIsAdmin = await isUserAdmin(sock, groupId, userToMute);
        if (targetIsAdmin) {
            return await sock.sendMessage(groupId, { text: "❌ You cannot mute other admins!" }, { quoted: msg });
        }

        // Save mute state
        const unmuteTime = Date.now() + (muteTime * 1000);
        if (!mutedUsers.has(groupId)) {
            mutedUsers.set(groupId, new Map());
        }
        mutedUsers.get(groupId).set(userToMute, unmuteTime);

        // Auto unmute after time
        setTimeout(() => {
            if (mutedUsers.has(groupId)) {
                mutedUsers.get(groupId).delete(userToMute);
                if (mutedUsers.get(groupId).size === 0) {
                    mutedUsers.delete(groupId);
                }
            }
        }, muteTime * 1000);

    } catch (error) {
        console.error("Mute command error:", error);
    }
}

// Check if user is muted
export function isUserMuted(groupId, userId) {
    if (!mutedUsers.has(groupId)) return false;
    const userMuteData = mutedUsers.get(groupId).get(userId);
    if (!userMuteData) return false;

    if (Date.now() > userMuteData) {
        mutedUsers.get(groupId).delete(userId);
        if (mutedUsers.get(groupId).size === 0) {
            mutedUsers.delete(groupId);
        }
        return false;
    }
    return true;
}

// Auto-delete muted users' messages silently
export async function handleMutedUsers(sock, msg) {
    try {
        if (!msg.message || msg.key.fromMe) return;
        const groupId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (isUserMuted(groupId, sender)) {
            await sock.sendMessage(groupId, { delete: msg.key });
        }
    } catch (error) {
        console.error("Error handling muted user:", error);
    }
}

// Helpers
async function isUserAuthorized(sock, groupId, userId) {
    try {
        const normalizedOwners = (global.owners || []).map(o => o.replace(/\D/g, ""));
        const userNumber = userId.split('@')[0].replace(/\D/g, "");
        if (normalizedOwners.includes(userNumber)) return true;

        const normalizedMods = (global.moderators || []).map(m => m.replace(/\D/g, ""));
        if (normalizedMods.includes(userNumber)) return true;

        return await isUserAdmin(sock, groupId, userId);
    } catch {
        return false;
    }
}

async function isUserAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === userId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch {
        return false;
    }
}

// Parse mute time (s, m, h, d)
function parseTime(timeStr) {
    const regex = /^(\d+)([smhd])$/;
    const match = timeStr.match(regex);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return null;
    }
}
