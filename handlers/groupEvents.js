import fs from 'fs';
import path from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const WELCOME_FILE = path.join(process.cwd(), 'data', 'welcome_messages.json');
const LEAVE_FILE = path.join(process.cwd(), 'data', 'leave_messages.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(WELCOME_FILE))) {
    fs.mkdirSync(path.dirname(WELCOME_FILE), { recursive: true });
}

function loadMessages(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (error) {
        console.error('❌ Error loading messages:', error);
    }
    return {};
}

function saveMessages(file, messages) {
    try {
        fs.writeFileSync(file, JSON.stringify(messages, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving messages:', error);
        return false;
    }
}

export async function handleGroupParticipantsUpdate(sock, update) {
    try {
        const { id, participants, action } = update;

        console.log(`👥 Group update: ${action} in ${id}`);
        console.log('Participants:', participants);

        // Load saved messages
        const welcomeMessages = loadMessages(WELCOME_FILE);
        const leaveMessages = loadMessages(LEAVE_FILE);

        for (let participant of participants) {
            let userJid = participant.id || participant;
            if (!userJid) continue;

            // 🔑 Normalize so it’s always @s.whatsapp.net
            userJid = jidNormalizedUser(userJid);
            const userNumber = userJid.split('@')[0];

            console.log('➡ Processing user:', userJid);

            if (action === 'add') {
                const welcomeMessage = welcomeMessages[id];
                if (welcomeMessage) {
                    const formatted = welcomeMessage.replace(/@mention/g, `@${userNumber}`);
                    console.log('✅ Sending welcome:', formatted);

                    await sock.sendMessage(id, {
                        text: formatted,
                        mentions: [userJid]
                    });
                }

            } else if (action === 'remove') {
                const leaveMessage = leaveMessages[id];
                if (leaveMessage) {
                    const formatted = leaveMessage.replace(/@mention/g, `@${userNumber}`);
                    console.log('✅ Sending leave:', formatted);

                    await sock.sendMessage(id, {
                        text: formatted,
                        mentions: [userJid]
                    });
                }
            }
        }
    } catch (error) {
        console.error('❌ Error in group participants update:', error);
    }
}

// Exported helper functions
export function getWelcomeMessage(groupId) {
    const messages = loadMessages(WELCOME_FILE);
    return messages[groupId];
}

export function setWelcomeMessage(groupId, message) {
    const messages = loadMessages(WELCOME_FILE);
    messages[groupId] = message;
    return saveMessages(WELCOME_FILE, messages);
}

export function removeWelcomeMessage(groupId) {
    const messages = loadMessages(WELCOME_FILE);
    delete messages[groupId];
    return saveMessages(WELCOME_FILE, messages);
}

export function getLeaveMessage(groupId) {
    const messages = loadMessages(LEAVE_FILE);
    return messages[groupId];
}

export function setLeaveMessage(groupId, message) {
    const messages = loadMessages(LEAVE_FILE);
    messages[groupId] = message;
    return saveMessages(LEAVE_FILE, messages);
}

export function removeLeaveMessage(groupId) {
    const messages = loadMessages(LEAVE_FILE);
    delete messages[groupId];
    return saveMessages(LEAVE_FILE, messages);
}
