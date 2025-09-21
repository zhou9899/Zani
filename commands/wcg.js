// commands/wordchain.js
export const name = "wcg";
export const description = "Word Chain Game - use .wcg [start|join|word|end] to play";
export const aliases = ["wordchain"];
export const category = "games";
export const adminOnly = false;

export async function execute(sock, msg, args) {
    const groupJid = msg.key.remoteJid;
    const playerJid = msg.key.participant || msg.key.remoteJid;
    const playerNumber = playerJid.split("@")[0];
    const subCommand = args[0]?.toLowerCase();

    // Initialize globals
    if (!global.gameSessions) global.gameSessions = {};
    if (!global.gameTimers) global.gameTimers = {};
    if (!global.gameLobbies) global.gameLobbies = {};

    // Constants
    const TIME_LIMIT = 30000; // 30 sec per move
    const EXPIRE_TIME = 600000; // 10 min inactivity
    const LOBBY_TIME = 30000; // 30 sec to join
    const MIN_PLAYERS = 2;
    const MAX_PLAYERS = 10;

    // ---------- START ----------
    if (subCommand === "start") {
        if (global.gameSessions[groupJid])
            return await sock.sendMessage(groupJid, { text: "❌ A game is already running!" });
        if (global.gameLobbies[groupJid])
            return await sock.sendMessage(groupJid, { text: "❌ A lobby already exists!" });

        global.gameLobbies[groupJid] = {
            host: playerJid,
            players: [playerJid],
            created: Date.now(),
            timer: setTimeout(() => {
                if (global.gameLobbies[groupJid]) {
                    sock.sendMessage(groupJid, { text: "⌛ Lobby expired, not enough players!" });
                    delete global.gameLobbies[groupJid];
                }
            }, LOBBY_TIME)
        };

        return await sock.sendMessage(groupJid, {
            text: `🎯 *WORD CHAIN LOBBY CREATED!*\n👤 Host: @${playerNumber}\n👥 Players: 1/${MAX_PLAYERS}\n\nOthers use: .wcg join\n⏰ Lobby expires in ${LOBBY_TIME / 1000}s`,
            mentions: [playerJid]
        });
    }

    // ---------- JOIN ----------
    if (subCommand === "join") {
        const lobby = global.gameLobbies[groupJid];
        if (!lobby) return await sock.sendMessage(groupJid, { text: "❌ No lobby to join!" });
        if (lobby.players.includes(playerJid))
            return await sock.sendMessage(groupJid, { text: `❌ @${playerNumber} already joined!`, mentions: [playerJid] });
        if (lobby.players.length >= MAX_PLAYERS)
            return await sock.sendMessage(groupJid, { text: "❌ Lobby is full!" });

        lobby.players.push(playerJid);

        return await sock.sendMessage(groupJid, {
            text: `✅ @${playerNumber} joined the game!\n👥 Players: ${lobby.players.length}/${MAX_PLAYERS}`,
            mentions: [playerJid]
        });
    }

    // ---------- END ----------
    if (subCommand === "end") {
        if (global.gameSessions[groupJid]) {
            delete global.gameSessions[groupJid];
            if (global.gameTimers[groupJid]) {
                clearTimeout(global.gameTimers[groupJid]);
                delete global.gameTimers[groupJid];
            }
            return await sock.sendMessage(groupJid, { text: `❌ Game ended by @${playerNumber}`, mentions: [playerJid] });
        }
        if (global.gameLobbies[groupJid]) {
            clearTimeout(global.gameLobbies[groupJid].timer);
            delete global.gameLobbies[groupJid];
            return await sock.sendMessage(groupJid, { text: `❌ Lobby cancelled by @${playerNumber}`, mentions: [playerJid] });
        }
        return await sock.sendMessage(groupJid, { text: "❌ No active game or lobby to end!" });
    }

    // ---------- DEFAULT: SHOW HELP ----------
    if (!subCommand) {
        return await sock.sendMessage(groupJid, {
            text: `🎯 *WORD CHAIN GAME HELP*\n
.start - Create a new game lobby
.join - Join existing lobby
.end - End current game/lobby
.word [your_word] - Play a word (during game)

📝 Example: .wcg start
⏰ Time limit: 30 seconds per turn
👥 Players: ${MIN_PLAYERS}-${MAX_PLAYERS}`
        });
    }

    // ---------- WORD PLAY ----------
    if (!global.gameSessions[groupJid]) {
        if (global.gameLobbies[groupJid]) {
            return await sock.sendMessage(groupJid, {
                text: `⏳ Lobby active with ${global.gameLobbies[groupJid].players.length}/${MAX_PLAYERS} players.\nUse .wcg join to participate!`
            });
        }
        return await sock.sendMessage(groupJid, { text: `@${playerNumber} No active game. Type .wcg start to create one.`, mentions: [playerJid] });
    }

    // Add your game logic here for word validation, turns, etc.
    // You'll need to implement the actual word chain gameplay mechanics
    return await sock.sendMessage(groupJid, {
        text: "🔄 Game logic not yet implemented. Coming soon!",
        mentions: [playerJid]
    });
}
