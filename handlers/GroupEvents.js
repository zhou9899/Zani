import fs from 'fs';
import path from 'path';

const WELCOME_FILE = path.join(process.cwd(), 'data', 'welcome_messages.json');
const LEAVE_FILE = path.join(process.cwd(), 'data', 'leave_messages.json');

function loadMessages(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
    return {};
}

export async function handleGroupParticipantsUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        
        console.log(`👥 Group update: ${action} in ${id}`);

        // Load messages
        const welcomeMessages = loadMessages(WELCOME_FILE);
        const leaveMessages = loadMessages(LEAVE_FILE);
        
        for (const participant of participants) {
            const userJid = participant.id || participant;
            if (!userJid) continue;

            // Get user name
            const userName = await getUserName(sock, userJid);
            
            if (action === 'add') {
                const welcomeMessage = welcomeMessages[id];
                if (welcomeMessage) {
                    // Simple: Replace @mention with user's name and mention them
                    const formattedMessage = welcomeMessage.replace(/@mention/g, userName);
                    
                    await sock.sendMessage(id, {
                        text: formattedMessage,
                        mentions: [userJid] // This makes it clickable
                    });
                }
                
            } else if (action === 'remove') {
                const leaveMessage = leaveMessages[id];
                if (leaveMessage) {
                    // Simple: Replace @mention with user's name and mention them
                    const formattedMessage = leaveMessage.replace(/@mention/g, userName);
                    
                    await sock.sendMessage(id, {
                        text: formattedMessage,
                        mentions: [userJid] // This makes it clickable
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error handling group participants update:', error);
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
