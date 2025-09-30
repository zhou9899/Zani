import fetch from "node-fetch";

// Map ISO codes to full language names
const LANG_MAP = {
  en: "English", ja: "Japanese", zh: "Chinese", ko: "Korean",
  fr: "French", de: "German", es: "Spanish", it: "Italian",
  ru: "Russian", pt: "Portuguese", ar: "Arabic", hi: "Hindi",
  // Add more as needed
};

export const name = "tt";
export const description = "Translate a replied-to message";
export const ownerOnly = false;
export const adminOnly = false;

export async function execute(sock, msg, args) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ Reply to a message to translate." }, { quoted: msg });
    }

    // Extract text
    const type = Object.keys(quoted)[0];
    const text = (type === "conversation") ? quoted.conversation
                  : quoted[type]?.caption || quoted[type]?.text || "";
    if (!text) return sock.sendMessage(msg.key.remoteJid, { text: "❌ No text found in the replied message." }, { quoted: msg });

    // Handle very long text by limiting to 5000 chars (LibreTranslate limit)
    const inputText = text.length > 5000 ? text.slice(0, 5000) : text;

    // Detect language
    const detectRes = await fetch("https://libretranslate.de/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: inputText })
    });
    const detectData = await detectRes.json();
    const detectedLangCode = detectData[0]?.language || "unknown";
    const detectedLang = LANG_MAP[detectedLangCode] || detectedLangCode;

    // Translate
    const translateRes = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: inputText,
        source: detectedLangCode,
        target: "en",
        format: "text"
      })
    });
    const translateData = await translateRes.json();
    const translatedText = translateData.translatedText || "Translation failed";

    // Reply
    await sock.sendMessage(msg.key.remoteJid, {
      text: `Language: ${detectedLang}\nTranslation: ${translatedText}`
    }, { quoted: msg });

  } catch (err) {
    console.error("Translation error:", err);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Translation error. Possibly unsupported characters." }, { quoted: msg });
  }
}	
