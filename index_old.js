const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const path = require('path');
const fetch = require('node-fetch');

// Auth folder
const authFolder = path.join(__dirname, 'auth_info');
const prefix = ".";

// Local jokes array (fallback)
const jokes = [
    "Why don’t skeletons ever fight each other? They don’t have the guts.",
    "I told my computer I needed a break… now it won’t stop sending me Kit-Kats.",
    "Why can’t your nose be 12 inches long? Because then it would be a foot!"
];

// Commands
const commands = {
    test: {
        description: "Check bot latency (ms) + Yare Yare!",
        execute: async (sock, msg) => {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: "Checking..." });
            const end = Date.now();
            const latency = end - start;
            await sock.sendMessage(msg.key.remoteJid, { text: `Yare Yare! ${latency} ms` });
        }
    },
    joke: {
        description: "Get a random joke",
        execute: async (sock, msg) => {
            let jokeText = "";
            try {
                const res = await fetch('https://official-joke-api.appspot.com/random_joke', { timeout: 5000 });
                if (res.ok) {
                    const data = await res.json();
                    jokeText = `${data.setup}\n${data.punchline}`;
                } else {
                    throw new Error("API not ok");
                }
            } catch (err) {
                const localJoke = jokes[Math.floor(Math.random() * jokes.length)];
                jokeText = `API failed, here’s one from me:\n${localJoke}`;
            }
            await sock.sendMessage(msg.key.remoteJid, { text: jokeText });
        }
    },
    about: {
        description: "Info about this bot",
        execute: async (sock, msg) => {
            await sock.sendMessage(msg.key.remoteJid, { text: "This bot is made by Zhou. Version 1.0" });
        }
    },
    menu: {
        description: "Show all commands",
        execute: async (sock, msg) => {
            // Fancy menu text
            let menuText = "🌟 *Zhou Bot Menu* 🌟\n\n";
            let i = 1;
            for (let cmd in commands) {
                menuText += `🔹 ${i}. *.${cmd}* - ${commands[cmd].description}\n`;
                i++;
            }
            menuText += `\n💡 Use the buttons or type commands with the prefix '${prefix}'`;

            // Prepare Rimuru image
            const media = await prepareWAMessageMedia({ image: { path: './rimuru.jpg' } }, { upload: sock.waUploadToServer });

            // Generate message with buttons
            const message = generateWAMessageFromContent(
                msg.key.remoteJid,
                proto.Message.fromObject({
                    imageMessage: media.imageMessage,
                    caption: menuText,
                    footer: "🤖 Zhou Bot • Have fun!",
                    buttons: [
                        { buttonId: `${prefix}help`, buttonText: { displayText: '❓ Help' }, type: 1 },
                        { buttonId: `${prefix}about`, buttonText: { displayText: 'ℹ️ About' }, type: 1 }
                    ],
                    headerType: 4
                }),
                { quoted: msg }
            );

            await sock.sendMessage(msg.key.remoteJid, message);
        }
    },
    help: {
        description: "Show help message",
        execute: async (sock, msg) => {
            await commands.menu.execute(sock, msg);
        }
    }
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('⚠️ Logged out, delete auth_info folder and restart bot');
                return;
            }
            console.log('♻️ Reconnecting in 5s...');
            setTimeout(startBot, 5000);
        } else if (connection === 'open') {
            console.log('✅ Bot connected!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const messageType = Object.keys(msg.message)[0];
            let text = '';

            if (messageType === 'conversation') text = msg.message.conversation;
            else if (messageType === 'extendedTextMessage') text = msg.message.extendedTextMessage.text;

            if (!text) return;

            if (text.startsWith(prefix)) {
                const commandName = text.slice(prefix.length).trim().toLowerCase();
                if (commands[commandName]) {
                    await commands[commandName].execute(sock, msg);
                }
            }

        } catch (err) {
            console.log('Error handling message:', err);
        }
    });
}

startBot();
