import { getRealNumber } from "../helpers/ai.js";
import { areJidsSameUser } from '@whiskeysockets/baileys';

export const name = "kick";
export const description = "Remove a member from the group";
export const adminOnly = true;

// Helper function to normalize JIDs for comparison
function normalizeJidForComparison(jid) {
    if (!jid) return jid;
    
    // Remove resource part (after /)
    let normalized = jid.split('/')[0];
    
    // Convert lid to standard format for comparison
    if (normalized.endsWith('@lid')) {
        return normalized.replace('@lid', '@s.whatsapp.net');
    }
    
    return normalized;
}

// Helper to extract the number part from any JID format
function extractNumberFromJid(jid) {
    if (!jid) return null;
    return jid.split('@')[0].replace(/\D/g, '');
}

export async function execute(sock, m, args) {
    const from = m.key.remoteJid;

    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ This command works only in groups." });
    }

    let metadata;
    try {
        metadata = await sock.groupMetadata(from);
    } catch (err) {
        console.error("❌ Failed to fetch group metadata:", err);
        return sock.sendMessage(from, { text: "❌ Could not get group info." });
    }

    // Get bot's number from the log (64369295642766)
    const botNumber = "64369295642766";
    
    // Find bot in participants by number match
    const botParticipant = metadata.participants.find(p => {
        const participantNumber = extractNumberFromJid(p.id);
        return participantNumber === botNumber;
    });

    if (!botParticipant) {
        console.log("Bot not found in participants list");
        console.log("Bot number:", botNumber);
        console.log("Participants:", metadata.participants.map(p => p.id));
        return sock.sendMessage(from, { text: "❌ I am not in this group!" });
    }

    const isBotAdmin = botParticipant.admin === "admin" || botParticipant.admin === "superadmin";
    if (!isBotAdmin) {
        return sock.sendMessage(from, { text: "❌ I must be an admin to kick members." });
    }

    let target;
    const ctx = m.message?.extendedTextMessage?.contextInfo;

    if (ctx?.mentionedJid?.length) {
        target = ctx.mentionedJid[0];
    } else if (ctx?.participant) {
        target = ctx.participant;
    } else if (args[0]) {
        const number = args[0].replace(/\D/g, "");
        if (number.length < 8 || number.length > 15) {
            return sock.sendMessage(from, { text: "❌ Invalid phone number provided." });
        }
        target = number + "@s.whatsapp.net";
    }

    if (!target) {
        return sock.sendMessage(from, { text: "⚠️ Reply, mention, or provide a number to kick." });
    }

    // Extract target number for comparison
    const targetNumber = extractNumberFromJid(target);
    
    // Find target participant by number match
    const targetParticipant = metadata.participants.find(p => {
        const participantNumber = extractNumberFromJid(p.id);
        return participantNumber === targetNumber;
    });
    
    if (!targetParticipant) {
        return sock.sendMessage(from, { text: "❌ User not found in this group." });
    }

    // Check if target is owner
    const ownerNumber = extractNumberFromJid(metadata.owner);
    if (targetNumber === ownerNumber) {
        return sock.sendMessage(from, { text: "⚠️ Cannot kick the group owner!" });
    }

    // Check if target is bot
    if (targetNumber === botNumber) {
        return sock.sendMessage(from, { text: "⚠️ I cannot kick myself!" });
    }

    // Get display number for message
    const targetReal = getRealNumber(targetNumber) || targetNumber;

    try {
        // Use the actual participant ID (with @lid) for the kick operation
        await sock.groupParticipantsUpdate(from, [targetParticipant.id], "remove");
        await sock.sendMessage(from, {
            text: `✅ Removed @${targetReal}`,
            mentions: [targetParticipant.id]
        });
        console.log(`✅ Kicked member: ${targetParticipant.id} (${targetReal})`);
    } catch (err) {
        console.error("Kick error:", err);
        let errorMessage = `❌ Failed to kick @${targetReal}.`;
        
        if (err.message.includes("not authorized")) {
            errorMessage += " I may not have sufficient permissions.";
        } else if (err.message.includes("not in group")) {
            errorMessage += " The user may have already left the group.";
        } else {
            errorMessage += " An unexpected error occurred.";
        }
        
        await sock.sendMessage(from, {
            text: errorMessage,
            mentions: [targetParticipant.id]
        });
    }
}
