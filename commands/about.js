import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const name = "about";
export const aliases = ["zani", "bio", "identity"];
export const description = "Learn about Zani's dual life with profile picture";

export async function execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    
    const aboutText = `
💁‍♀️ *ZANI - THE DUAL LIFE*

*🏦 Day Identity: Bank Employee*
• Workplace: Averardo Bank (Montelli Family)
• Role: Financial Associate  
• Traits: Serious, Reliable, Meticulous
• Cover: Perfect civilian identity

*🌙 Night Identity: Blazing Nightwalker*
• Mission: Vigilante Justice
• Abilities: Fire & Shadow Manipulation
• Operations: Covert nighttime patrols
• Signature: Crimson embers

*🔥 Special Abilities*
• Pyro-kinesis (Fire control)
• Shadow manipulation  
• Financial analysis
• Urban investigation

*💬 Philosophy*
"By day, I manage accounts. By night, I balance justice."
"The numbers must add up... both in ledgers and in karma."

⚠️ *Confidential Information*
This identity is protected for operational security.

*"Two lives, one purpose - justice."*
    `.trim();

    try {
        // Try to read the local image file
        const imagePath = '/storage/emulated/0/Pictures/Zani about.jpeg';
        
        if (existsSync(imagePath)) {
            console.log('📸 Found Zani image, sending with picture...');
            
            const imageBuffer = readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: aboutText,
                quoted: msg
            });
        } else {
            console.log('📸 Zani image not found, sending text only...');
            // Fallback: send text only if image not found
            await sock.sendMessage(chatId, { 
                text: aboutText,
                quoted: msg
            });
        }
        
    } catch (error) {
        console.error('About command error:', error);
        // Ultimate fallback - minimal message
        await sock.sendMessage(chatId, {
            text: "💁‍♀️ Zani - Bank employee by day, Blazing Nightwalker vigilante by night. Protecting Wuthering Waves while working at Averardo Bank."
        });
    }
}
