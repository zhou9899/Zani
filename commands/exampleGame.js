// commands/exampleGame.js
export default {
  name: "examplegame",          // Must match loader's "name"
  description: "Description of your game here",
  adminOnly: false,             // Optional: true if only admins can run
  async execute(sock, msg, args) {
    const userJid = msg.key.participant || msg.key.remoteJid;
    const userMention = `@${userJid.split('@')[0]}`;

    // Example message
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🎮 Example Game command loaded!\nHello ${userMention}, ready to play?`,
      mentions: [userJid]
    }, { quoted: msg });

    // Your game logic goes here
  }
}
