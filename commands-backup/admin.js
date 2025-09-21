export const name = 'admin';
export const description = 'Promote or demote group members safely';

export async function execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ This works only in groups.' }, { quoted: msg });

    if (!args[0] || !['promote','demote'].includes(args[0].toLowerCase())) {
        return sock.sendMessage(chatId, { text: '❌ Usage: .admin <promote|demote> @user' }, { quoted: msg });
    }

    const action = args[0].toLowerCase();
    let target;

    // Mentions first
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length) target = ctx.mentionedJid[0];
    // Fallback to number
    else if (args[1]) target = args[1].replace(/[^0-9]/g,'')+'@s.whatsapp.net';

    if (!target) return sock.sendMessage(chatId, { text: '❌ Mention someone or provide a number.' }, { quoted: msg });

    try {
        const groupMeta = await sock.groupMetadata(chatId);
        const botJid = sock.user.id.split(':')[0];

        // Check if bot is admin
        const botIsAdmin = groupMeta.participants.find(p => p.jid.split(':')[0] === botJid)?.admin;
        if (!botIsAdmin) return sock.sendMessage(chatId, { text: '❌ I need to be an admin to perform this action.' }, { quoted: msg });

        // Optional: check if sender is admin
        const senderJid = msg.key.participant;
        const senderIsAdmin = groupMeta.participants.find(p => p.jid === senderJid)?.admin;
        if (!senderIsAdmin) return sock.sendMessage(chatId, { text: '❌ Only admins can use this command.' }, { quoted: msg });

        // Execute action
        await sock.groupParticipantsUpdate(chatId, [target], action);
        await sock.sendMessage(chatId, { text: `✅ Successfully ${action}d @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });

    } catch (err) {
        console.error('❌ Admin command error:', err);
        await sock.sendMessage(chatId, { text: '❌ Something went wrong.' }, { quoted: msg });
    }
}
