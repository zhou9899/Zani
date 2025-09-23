// commands/wcg.js
export const name = "wcg";
export const description = "Word Chain Game - play words without prefix";
export const aliases = ["wordchain"];
export const category = "games";
export const adminOnly = false;

// Dictionary API function
async function checkWord(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        return response.ok; // true if word exists
    } catch (error) {
        console.error('Dictionary API error:', error);
        return false;
    }
}

export async function execute(sock, msg, args) {
    const groupJid = msg.key.remoteJid;
    const playerJid = msg.key.participant || msg.key.remoteJid;
    const playerNumber = playerJid.split("@")[0];

    // Initialize globals
    if (!global.gameSessions) global.gameSessions = {};
    if (!global.gameLobbies) global.gameLobbies = {};

    const TIME_LIMIT = 30000; // 30s per turn
    const LOBBY_TIME = 30000; // 30s lobby wait
    const MIN_PLAYERS = 2;
    const MAX_PLAYERS = 10;
    const MIN_WORD_LENGTH = 3;

    // ---------- START ----------
    if (args[0]?.toLowerCase() === "start") {
        if (global.gameSessions[groupJid])
            return await sock.sendMessage(groupJid, { text: "❌ A game is already running!" });
        if (global.gameLobbies[groupJid])
            return await sock.sendMessage(groupJid, { text: "❌ A lobby already exists!" });

        global.gameLobbies[groupJid] = {
            host: playerJid,
            players: [playerJid],
            created: Date.now(),
            timer: setTimeout(async () => {
                const lobby = global.gameLobbies[groupJid];
                if (!lobby) return;

                if (lobby.players.length < MIN_PLAYERS) {
                    await sock.sendMessage(groupJid, { text: "⌛ Lobby expired, not enough players!" });
                    delete global.gameLobbies[groupJid];
                } else {
                    // Auto-start the game
                    const players = lobby.players;
                    delete global.gameLobbies[groupJid];

                    global.gameSessions[groupJid] = {
                        players,
                        turnIndex: 0,
                        lastWord: null,
                        usedWords: new Set(),
                        turnTimer: null,
                        minLength: MIN_WORD_LENGTH
                    };

                    await sock.sendMessage(groupJid, {
                        text: `🎉 Game started automatically with ${players.length} players!
📝 Last word: none
🔤 Starting letter: any
✏️ Minimum word length: ${MIN_WORD_LENGTH}
➡️ It's @${players[0].split("@")[0]}'s turn`,
                        mentions: [players[0]]
                    });

                    startTurnTimer(groupJid, sock);
                }
            }, LOBBY_TIME)
        };

        return await sock.sendMessage(groupJid, {
            text: `🎯 *WORD CHAIN LOBBY CREATED!*
👤 Host: @${playerNumber}
👥 Players: 1/${MAX_PLAYERS}
Others use: .wcg join
⏰ Lobby expires in ${LOBBY_TIME / 1000}s`,
            mentions: [playerJid]
        });
    }

    // ---------- JOIN ----------
    if (args[0]?.toLowerCase() === "join") {
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
    if (args[0]?.toLowerCase() === "end") {
        if (global.gameSessions[groupJid]) {
            clearTimeout(global.gameSessions[groupJid].turnTimer);
            delete global.gameSessions[groupJid];
            return await sock.sendMessage(groupJid, { text: `❌ Game ended by @${playerNumber}`, mentions: [playerJid] });
        }
        if (global.gameLobbies[groupJid]) {
            clearTimeout(global.gameLobbies[groupJid].timer);
            delete global.gameLobbies[groupJid];
            return await sock.sendMessage(groupJid, { text: `❌ Lobby cancelled by @${playerNumber}`, mentions: [playerJid] });
        }
        return await sock.sendMessage(groupJid, { text: "❌ No active game or lobby to end!" });
    }

    // ---------- PLAY WORD ----------
    const session = global.gameSessions[groupJid];
    if (session) {
        const currentPlayer = session.players[session.turnIndex];

        if (playerJid !== currentPlayer) {
            // Notify player if not their turn
            return await sock.sendMessage(groupJid, { 
                text: `❌ It's not your turn, @${playerNumber}`, 
                mentions: [playerJid] 
            });
        }

        const word = (args[0] || msg.message?.conversation || "").toLowerCase().trim();
        if (!word) return;

        // Validate word
        if (word.length < MIN_WORD_LENGTH)
            return await sock.sendMessage(groupJid, { text: `❌ Word must be at least ${MIN_WORD_LENGTH} letters`, mentions: [playerJid] });

        if (!/^[a-z]+$/.test(word))
            return await sock.sendMessage(groupJid, { text: `❌ Word must contain only letters`, mentions: [playerJid] });

        if (session.lastWord && word[0] !== session.lastWord.slice(-1))
            return await sock.sendMessage(groupJid, { text: `❌ Word must start with "${session.lastWord.slice(-1)}"`, mentions: [playerJid] });

        if (session.usedWords.has(word))
            return await sock.sendMessage(groupJid, { text: `❌ "${word}" was already used`, mentions: [playerJid] });

        const valid = await checkWord(word);
        if (!valid)
            return await sock.sendMessage(groupJid, { text: `❌ "${word}" is not a valid English word`, mentions: [playerJid] });

        // Valid word
        session.lastWord = word;
        session.usedWords.add(word);
        session.turnIndex = (session.turnIndex + 1) % session.players.length;

        clearTimeout(session.turnTimer);
        startTurnTimer(groupJid, sock);

        const nextPlayer = session.players[session.turnIndex];
        const startingLetter = session.lastWord.slice(-1);

        await sock.sendMessage(groupJid, {
            text: `✅ @${playerNumber} played: ${word}
📝 Words used: ${Array.from(session.usedWords).join(" → ")}
🔤 Next word must start with: ${startingLetter}
✏️ Minimum word length: ${MIN_WORD_LENGTH}
➡️ Next turn: @${nextPlayer.split("@")[0]}`,
            mentions: [nextPlayer]
        });
        return;
    }

    // ---------- HELP ----------
    return await sock.sendMessage(groupJid, {
        text: `🎯 *WORD CHAIN GAME HELP*
.start - Create lobby
.join - Join lobby
.end - End game/lobby
Simply send a word to play when your turn comes.`
    });
}

// Turn timer
function startTurnTimer(groupJid, sock) {
    const session = global.gameSessions[groupJid];
    if (!session) return;

    session.turnTimer = setTimeout(async () => {
        const currentPlayer = session.players[session.turnIndex];
        session.players.splice(session.turnIndex, 1);

        if (session.players.length === 1) {
            await sock.sendMessage(groupJid, {
                text: `🏆 @${session.players[0].split("@")[0]} wins by default! Game over.`,
                mentions: [session.players[0]]
            });
            delete global.gameSessions[groupJid];
        } else if (session.players.length === 0) {
            await sock.sendMessage(groupJid, { text: "❌ Game ended - no players left!" });
            delete global.gameSessions[groupJid];
        } else {
            session.turnIndex = session.turnIndex % session.players.length;
            const nextPlayer = session.players[session.turnIndex];
            await sock.sendMessage(groupJid, {
                text: `⏰ @${currentPlayer.split("@")[0]} timed out! Removed from game.
➡️ Next turn: @${nextPlayer.split("@")[0]}`,
                mentions: [nextPlayer]
            });
            startTurnTimer(groupJid, sock);
        }
    }, 30000);
}
