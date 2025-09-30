import axios from 'axios';

export const name = "pint";
export const description = "Search and download Pinterest images";
export const usage = ".pint <search query> | .pint cats 5";

export async function execute(sock, msg, args) {
    try {
        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `📌 *Pinterest Search*\n\nUsage: ${usage}\nExamples:\n• .pint cats\n• .pint dogs 3\n• .pint aesthetic 5`
            }, { quoted: msg });
        }

        let searchQuery = args.join(' ');
        let count = 4;
        
        const lastArg = args[args.length - 1];
        if (!isNaN(lastArg) && lastArg > 0 && lastArg <= 8) {
            count = parseInt(lastArg);
            searchQuery = args.slice(0, -1).join(' ');
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🔍 *Searching Pinterest...*\n\n📝 Query: *${searchQuery}*\n📸 Images: ${count}\n\n⏳ Please wait...`
        }, { quoted: msg });

        // Use Pure Pinterest API
        const response = await axios.get(
            `http://localhost:3000/api/pinterest?search=${encodeURIComponent(searchQuery)}&limit=${count}`,
            { timeout: 20000 }
        );
        
        if (!response.data.images || response.data.images.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ No Pinterest images found for "${searchQuery}"`
            }, { quoted: msg });
            return;
        }

        // Send Pinterest images
        let sentCount = 0;
        for (let i = 0; i < response.data.images.length; i++) {
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: response.data.images[i].url },
                    caption: `📌 ${response.data.images[i].title}\n\n🖼️ ${i + 1}/${response.data.images.length}\n🔗 Source: ${response.data.images[i].source}`
                });
                sentCount++;
                
                if (i < response.data.images.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (error) {
                console.log(`Failed to send image ${i + 1}:`, error.message);
            }
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: `✅ *Pinterest Search Complete!*\n\n📝 Query: *${searchQuery}*\n📸 Sent: ${sentCount} Pinterest images`
        });

    } catch (error) {
        console.error("Pint command error:", error.message);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Pinterest Search Failed!*\n\nError: ${error.message}`
        }, { quoted: msg });
    }
}
