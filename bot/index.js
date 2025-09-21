const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('📌 Scan this QR code in WhatsApp Linked Devices');
        }
        if (connection === 'close') {
            console.log('❌ Connection closed, reconnecting...');
            startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot is connected!');
        }
    });

    sock.ev.on('messages.upsert', (msg) => {
        console.log('📩 New message:', msg);
    });
}

startBot();
