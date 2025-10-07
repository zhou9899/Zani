import { normalizeNumber } from "../utils/permissions.js";

export const name = "demote";
export const description = "Demote a user from admin\nUsage: .demote [@user|number|reply] or just .demote (for owners/mods)";
export const adminOnly = true;

export async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return;

    try {
        const metadata = await sock.groupMetadata(from);
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderJid.split("@")[0].replace(/\D/g, "");
        const normalizedSender = normalizeNumber(senderNumber);
        
        // Check if sender is group admin
        const senderParticipant = metadata.participants.find(p => p.id === senderJid);
        const isGroupAdmin = senderParticipant?.admin === "admin" || senderParticipant?.admin === "superadmin";
        
        // Check if sender is bot owner/mod
        const isOwner = global.owners.some(owner => 
            normalizeNumber(owner.replace(/\D/g, "")) === normalizedSender
        );
        const isMod = global.moderators.some(mod => 
            normalizeNumber(mod.replace(/\D/g, "")) === normalizedSender
        );

        if (!isGroupAdmin && !isOwner && !isMod) {
            return sock.sendMessage(from, { text: "❌ Only group admins, mods, or owners can use this command." });
        }

        let targetJid = null;

        // Check for mentions
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (ctx?.mentionedJid?.[0]) {
            targetJid = ctx.mentionedJid[0].split(":")[0];
        }
        // Check for direct number argument
        else if (args[0] && !isNaN(args[0].replace(/\D/g, ''))) {
            targetJid = normalizeNumber(args[0]) + "@s.whatsapp.net";
        }
        // Check for reply to someone else's message
        else if (ctx?.participant) {
            const repliedUserJid = ctx.participant;
            // Only use if it's not replying to yourself
            if (repliedUserJid !== senderJid) {
                targetJid = repliedUserJid;
            }
        }

        // If no target specified, check if we should demote self
        if (!targetJid) {
            if (isOwner || isMod) {
                // Owner/mod can demote themselves
                targetJid = senderJid;
            } else {
                // Regular admin needs to specify a target
                return sock.sendMessage(from, { 
                    text: "❌ Please specify a user to demote:\n• Mention: .demote @user\n• Reply: .demote (to user's message)\n• Number: .demote 1234567890" 
                });
            }
        }

        const targetNormalized = targetJid.split("@")[0];

        // Check if target is in group
        const targetParticipant = metadata.participants.find(p => {
            const participantNumber = p.id.split("@")[0];
            return participantNumber === targetNormalized;
        });

        if (!targetParticipant) {
            return sock.sendMessage(from, { text: "❌ User not found in this group." });
        }

        if (!targetParticipant.admin) {
            return sock.sendMessage(from, { 
                text: `⚠️ @${targetNormalized} is not an admin.`, 
                mentions: [targetJid] 
            });
        }

        // Prevent demoting the group owner (superadmin)
        if (targetParticipant.admin === "superadmin") {
            return sock.sendMessage(from, { 
                text: `❌ Cannot demote the group owner @${targetNormalized}.`, 
                mentions: [targetJid] 
            });
        }

        await sock.groupParticipantsUpdate(from, [targetJid], "demote");
        await sock.sendMessage(from, { 
            text: `✅ Demoted @${targetNormalized} from admin!`, 
            mentions: [targetJid] 
        });

    } catch (err) {
        console.error("DEMOTE ERROR:", err);
        let errorMsg = "❌ Failed to demote user";
        
        if (err.message?.includes("not authorized")) {
            errorMsg = "❌ I don't have admin permissions to demote users";
        } else if (err.message?.includes("404")) {
            errorMsg = "❌ User not found in group";
        } else if (err.message?.includes("401")) {
            errorMsg = "❌ I need to be an admin to demote users";
        }
        
        await sock.sendMessage(from, { text: errorMsg });
    }
}
