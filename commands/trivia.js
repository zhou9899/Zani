// commands/trivia.js
import fetch from "node-fetch";
export const name = "trivia";
export const description = "Play trivia!";
export const category = "games";
export const adminOnly = false;

if (!global.triviaGames) global.triviaGames = {};
const ongoingTrivia = global.triviaGames;

export const execute = async (sock, msg, args) => {
  try {
    const chatId = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;

    // Extract message text properly
    let messageText = "";
    if (msg.message?.conversation) {
      messageText = msg.message.conversation.trim();
    } else if (msg.message?.extendedTextMessage?.text) {
      messageText = msg.message.extendedTextMessage.text.trim();
    }

    let sub = (args[0] || "").toString().trim().toLowerCase();

    // Check if there's an ongoing trivia in this chat
    const currentTrivia = ongoingTrivia[chatId];

    // ---------- HANDLE PREFIX-LESS ANSWERS (1, 2, 3, 4) ----------
    if (currentTrivia && /^[1-4]$/.test(messageText)) {
      const selectedIndex = parseInt(messageText);

      // Check if trivia has expired
      if (Date.now() - currentTrivia.startTime > 30000) {
        await sock.sendMessage(chatId, {
          text: `⏰ Time's up! The correct answer was: *${currentTrivia.correctAnswer}*`
        });
        delete ongoingTrivia[chatId];
        return;
      }

      // Check if user has already answered
      if (currentTrivia.answeredUsers && currentTrivia.answeredUsers.includes(senderJid)) {
        return await sock.sendMessage(chatId, {
          text: "❌ You've already answered this trivia question! Wait for the next one."
        }, { quoted: msg });
      }

      if (selectedIndex < 1 || selectedIndex > currentTrivia.options.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please choose a valid option (1-${currentTrivia.options.length})!`
        });
      }

      const selectedAnswer = currentTrivia.options[selectedIndex - 1];
      const isCorrect = selectedAnswer === currentTrivia.correctAnswer;

      // Initialize answeredUsers array if it doesn't exist
      if (!currentTrivia.answeredUsers) {
        currentTrivia.answeredUsers = [];
      }

      // Mark user as having answered
      currentTrivia.answeredUsers.push(senderJid);

      if (isCorrect) {
        await sock.sendMessage(chatId, {
          text: `🎉 *Correct!* The answer was: *${currentTrivia.correctAnswer}*`
        }, { quoted: msg });
        delete ongoingTrivia[chatId];
      } else {
        await sock.sendMessage(chatId, {
          text: `❌ *Wrong!* You chose "${selectedAnswer}". Try again next time!`
        }, { quoted: msg });
      }
      return;
    }

    // ---------- START COMMAND ----------
    if (sub === "start") {
      if (ongoingTrivia[chatId]) {
        return await sock.sendMessage(chatId, {
          text: "🧠 A trivia question is already ongoing. Please answer it first!"
        });
      }

      const response = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return await sock.sendMessage(chatId, {
          text: "❌ Failed to fetch trivia question. Please try again."
        });
      }

      const questionData = data.results[0];
      const decodeHTML = (html) =>
        html.replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&uuml;/g, "ü")
            .replace(/&ouml;/g, "ö")
            .replace(/&auml;/g, "ä")
            .replace(/&eacute;/g, "é");

      const question = decodeHTML(questionData.question);
      const correctAnswer = decodeHTML(questionData.correct_answer);
      const incorrectAnswers = questionData.incorrect_answers.map(ans => decodeHTML(ans));
      const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);

      ongoingTrivia[chatId] = {
        correctAnswer,
        options: allAnswers,
        startTime: Date.now(),
        answeredUsers: [],
        timeout: setTimeout(async () => {
          if (ongoingTrivia[chatId]) {
            await sock.sendMessage(chatId, {
              text: `⏰ *Time's up!* No one got it right.\nThe correct answer was: *${correctAnswer}*`
            });
            delete ongoingTrivia[chatId];
          }
        }, 30000) // 30 seconds
      };

      let msgText = `🧠 *Trivia Time!*\n\n*Question:*\n${question}\n\n*Options:*\n`;
      allAnswers.forEach((ans, i) => msgText += `${i + 1}. ${ans}\n`);
      msgText += `\n⏰ *You have 30 seconds to answer!*\nReply with the option number (1-${allAnswers.length}) - you can just type the number without prefix!\n\n*Note:* One attempt per user!`;

      return await sock.sendMessage(chatId, { text: msgText });
    }

    // ---------- PREFIXED ANSWER (like .trivia 1) ----------
    if (currentTrivia && /^[1-4]$/.test(sub)) {
      const selectedIndex = parseInt(sub);

      // Check if trivia has expired
      if (Date.now() - currentTrivia.startTime > 30000) {
        await sock.sendMessage(chatId, {
          text: `⏰ Time's up! The correct answer was: *${currentTrivia.correctAnswer}*`
        });
        delete ongoingTrivia[chatId];
        return;
      }

      // Check if user has already answered
      if (currentTrivia.answeredUsers && currentTrivia.answeredUsers.includes(senderJid)) {
        return await sock.sendMessage(chatId, {
          text: "❌ You've already answered this trivia question! Wait for the next one."
        }, { quoted: msg });
      }

      if (selectedIndex < 1 || selectedIndex > currentTrivia.options.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please choose a valid option (1-${currentTrivia.options.length})!`
        });
      }

      const selectedAnswer = currentTrivia.options[selectedIndex - 1];
      const isCorrect = selectedAnswer === currentTrivia.correctAnswer;

      // Initialize answeredUsers array if it doesn't exist
      if (!currentTrivia.answeredUsers) {
        currentTrivia.answeredUsers = [];
      }

      // Mark user as having answered
      currentTrivia.answeredUsers.push(senderJid);

      if (isCorrect) {
        // Clear the timeout since someone answered correctly
        if (currentTrivia.timeout) {
          clearTimeout(currentTrivia.timeout);
        }
        await sock.sendMessage(chatId, {
          text: `🎉 *Correct!* The answer was: *${currentTrivia.correctAnswer}*`
        }, { quoted: msg });
        delete ongoingTrivia[chatId];
      } else {
        await sock.sendMessage(chatId, {
          text: `❌ *Wrong!* You chose "${selectedAnswer}". Try again next time!`
        }, { quoted: msg });
      }
      return;
    }

    // If no ongoing trivia and not starting one
    if (!currentTrivia && sub !== "start") {
      return await sock.sendMessage(chatId, {
        text: "❌ No active trivia session. Type `.trivia start` to begin!"
      });
    }

  } catch (err) {
    console.error("Trivia error:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ An error occurred while processing the trivia."
    });
  }
};
