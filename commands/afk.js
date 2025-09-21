import fs from 'fs';
import path from 'path';

export const name = "afk";
export const description = "Set AFK status with reason";
export const aliases = [];
export const category = "utility";
export const adminOnly = false;

const afkFile = path.join(process.cwd(), 'afk.json');
if (!global.afkUsers) {
    if (fs.existsSync(afkFile)) {
        global.afkUsers = JSON.parse(fs.readFileSync(afkFile, 'utf-8'));
    } else {
        global.afkUsers = {};
    }
}

function saveAFK() {
    fs.writeFileSync(afkFile, JSON.stringify(global.afkUsers, null, 2));
}

function formatTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days) return `${days}d ${hours % 24}h`;
    if (hours) return `${hours}h ${minutes % 60}m`;
    if (minutes) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Clean JID to remove any suffixes that cause @lid display
function cleanJID(jid) {
    if (!jid) return null;
    // Remove any suffix after : and ensure proper format
    return jid.split(':')[0];
}

export async function execute(sock, msg, args) {
    const userJid = msg.key.participant || msg.key.remoteJid;
    const cleanUserJid = cleanJID(userJid);
    const username = msg.pushName || 'User';
    let reason = args.join(' ') || "No reason provided";

    // Get mentioned users
    const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const cleanMentionedJids = mentionedJids.map(cleanJID).filter(jid => jid);

    // Clean reason by removing @mentions
    cleanMentionedJids.forEach(jid => {
        const number = jid.split('@')[0];
        reason = reason.replace(new RegExp(`@${number}`, 'g'), '').trim();
    });
    if (!reason) reason = "No reason provided";

    // Store AFK with cleaned JIDs
    global.afkUsers[cleanUserJid] = {
        reason,
        since: Date.now(),
        username,
        mentionedJids: cleanMentionedJids // Store cleaned JIDs
    };
    saveAFK();

    const mentionsArray = [cleanUserJid, ...cleanMentionedJids];

    let afkText = `🚨 <@${cleanUserJid}> is now AFK!\n📝 Reason: _${reason}_`;

    if (cleanMentionedJids.length) {
        afkText += `\n💌 Tagged: ${cleanMentionedJids.map(jid => `<@${jid}>`).join(' ')}`;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        text: afkText,
        mentions: mentionsArray
    }, { quoted: msg });
}

export const handleAFKMentions = async (sock, msg) => {
    if (!global.afkUsers || Object.keys(global.afkUsers).length === 0) return;

    const groupJid = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const cleanSenderJid = cleanJID(senderJid);

    // Remove AFK if sender returns
    if (global.afkUsers[cleanSenderJid]) {
        const afkData = global.afkUsers[cleanSenderJid];
        const timeAgo = formatTimeAgo(afkData.since);

        // Build mentions array for welcome back message
        const mentionsArray = [cleanSenderJid, ...(afkData.mentionedJids || [])];
        
        let welcomeText = `✅ Welcome back <@${cleanSenderJid}>!\n⏱ You were AFK for: _${timeAgo}_\n📝 Reason: _${afkData.reason}_`;
        
        if (afkData.mentionedJids && afkData.mentionedJids.length) {
            welcomeText += `\n💌 Was tagged with: ${afkData.mentionedJids.map(jid => `<@${jid}>`).join(' ')}`;
        }

        await sock.sendMessage(groupJid, {
            text: welcomeText,
            mentions: mentionsArray
        }, { quoted: msg });

        delete global.afkUsers[cleanSenderJid];
        saveAFK();
        return;
    }

    // Check mentioned JIDs in message
    const mentionedJids = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])
        .map(cleanJID)
        .filter(jid => jid);
    
    const notified = new Set();

    for (const jid of mentionedJids) {
        if (global.afkUsers[jid] && !notified.has(jid)) {
            const afkData = global.afkUsers[jid];
            const timeAgo = formatTimeAgo(afkData.since);

            const replyText = `🔔 <@${jid}> is currently AFK!\n📝 Reason: _${afkData.reason}_\n⏱ AFK for: _${timeAgo}_`;

            await sock.sendMessage(groupJid, {
                text: replyText,
                mentions: [jid]
            }, { quoted: msg });

            notified.add(jid);
        }
    }

    saveAFK();
};
