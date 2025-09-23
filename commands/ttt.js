// commands/ttt.js
export const name = "ttt";
export const description = "Play Tic Tac Toe with friends!";
export const category = "games";
export const adminOnly = false;

if (!global.tttGames) global.tttGames = {};
const games = global.tttGames;

const BOARD_EMOJIS = { X: "❌", O: "⭕" };
const TURN_MS = 30000;       // 30s per turn
const INACTIVITY_MS = 600000; // 10m inactivity

// Render board with numbers for empty cells
function renderBoard(board) {
  return board
    .map((cell, idx) => (cell ? BOARD_EMOJIS[cell] : `${idx + 1}️⃣`))
    .reduce((acc, cell, idx) => {
      const endLine = (idx + 1) % 3 === 0 ? "\n" : " | ";
      return acc + cell + endLine;
    }, "")
    .trim();
}

// Check win
function checkWin(board, symbol) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(combo => combo.every(i => board[i] === symbol));
}

// End game cleanup
async function endGame(sock, groupJid, reason = "Game ended.") {
  const g = games[groupJid];
  if (!g) return;
  try { if (g.timers?.turn) clearTimeout(g.timers.turn); } catch {}
  try { if (g.timers?.inactivity) clearTimeout(g.timers.inactivity); } catch {}
  await sock.sendMessage(groupJid, { text: reason });
  delete games[groupJid];
}

// Move to next turn
function nextTurn(sock, groupJid) {
  const g = games[groupJid];
  if (!g) return;
  g.currentIndex = (g.currentIndex + 1) % g.players.length;
  const player = g.players[g.currentIndex];
  const symbol = g.symbols[player];

  sock.sendMessage(groupJid, {
    text: `@${player.split("@")[0]}, it's your turn!\n\n${renderBoard(g.board)}`,
    mentions: [player]
  });

  if (g.timers?.turn) clearTimeout(g.timers.turn);
  g.timers.turn = setTimeout(() => {
    sock.sendMessage(groupJid, {
      text: `⏰ @${player.split("@")[0]} took too long! Turn skipped.`,
      mentions: [player]
    });
    nextTurn(sock, groupJid);
  }, TURN_MS);
}

export async function execute(sock, msg, args) {
  try {
    const groupJid = msg.key.remoteJid;
    const playerJid = msg.key.participant || msg.key.remoteJid;

    // Detect number 1-9 as a move
    let sub = (args[0] || "").toString().trim().toLowerCase();
    if (!sub && /^[1-9]$/.test(msg.message?.conversation)) {
      sub = msg.message.conversation.trim(); // use raw number if no prefix
    }

    // ---------- START ----------
    if (sub === "start") {
      if (games[groupJid]) return sock.sendMessage(groupJid, { text: "❌ Game already running." });

      games[groupJid] = {
        host: playerJid,
        players: [playerJid],
        symbols: { [playerJid]: "X" },
        board: Array(9).fill(null),
        currentIndex: 0,
        timers: {}
      };

      return sock.sendMessage(groupJid, {
        text: `🎮 Tic Tac Toe started by @${playerJid.split("@")[0]}\n📢 Type *.ttt join* to join!`,
        mentions: [playerJid]
      });
    }

    // ---------- JOIN ----------
    if (sub === "join") {
      const g = games[groupJid];
      if (!g) return sock.sendMessage(groupJid, { text: "❌ No game lobby open. Use .ttt start" });
      if (g.players.includes(playerJid)) return;
      if (g.players.length >= 2) return sock.sendMessage(groupJid, { text: "❌ Game already has 2 players." });

      g.players.push(playerJid);
      g.symbols[playerJid] = "O";

      await sock.sendMessage(groupJid, {
        text: `✅ @${playerJid.split("@")[0]} joined! Game starting...`,
        mentions: [playerJid]
      });

      // Show board and first turn
      sock.sendMessage(groupJid, {
        text: `🎯 First turn: @${g.players[0].split("@")[0]} (${BOARD_EMOJIS[g.symbols[g.players[0]]]})\n\n${renderBoard(g.board)}`,
        mentions: g.players
      });

      nextTurn(sock, groupJid);
      return;
    }

    // ---------- END ----------
    if (sub === "end") {
      const g = games[groupJid];
      if (!g) return sock.sendMessage(groupJid, { text: "❌ No active game to end." });

      // owner/mod/admin check
      const owners = global.owners || [];
      const normalizedOwners = owners.map(n => n.replace(/\D/g,""));
      const senderNumber = playerJid.split("@")[0];
      const isOwner = normalizedOwners.includes(senderNumber);
      const isHost = g.host === playerJid;

      let isAdmin = false;
      try {
        const md = await sock.groupMetadata(groupJid);
        const part = md.participants.find(p => p.id === playerJid);
        isAdmin = part?.admin === "admin" || part?.admin === "superadmin";
      } catch {}

      if (!isOwner && !isAdmin && !isHost) {
        return sock.sendMessage(groupJid, { text: `❌ Only host/mod/owner can end the game.` });
      }

      return endGame(sock, groupJid, `🛑 Game ended by @${playerJid.split("@")[0]}`);
    }

    // ---------- PLAY ----------
    const g = games[groupJid];
    if (!g || g.players.length < 2) return;
    const currentPlayer = g.players[g.currentIndex];
    if (playerJid !== currentPlayer) return; // not your turn

    const move = parseInt(sub) - 1;
    if (isNaN(move) || move < 0 || move > 8) return;
    if (g.board[move]) return;

    const symbol = g.symbols[playerJid];
    g.board[move] = symbol;

    // check win
    if (checkWin(g.board, symbol)) {
      await sock.sendMessage(groupJid, {
        text: `🎉 @${playerJid.split("@")[0]} wins!\n\n${renderBoard(g.board)}`,
        mentions: [playerJid]
      });
      return endGame(sock, groupJid, `🏁 Game over! Winner: @${playerJid.split("@")[0]}`);
    }

    // check draw
    if (!g.board.includes(null)) {
      await sock.sendMessage(groupJid, { text: `🤝 It's a draw!\n\n${renderBoard(g.board)}` });
      return endGame(sock, groupJid, "🏁 Game ended in a draw.");
    }

    // next turn
    nextTurn(sock, groupJid);

  } catch (err) {
    console.error("TTT error:", err);
    try {
      await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error: ${err.message}` });
    } catch {}
  }
}
