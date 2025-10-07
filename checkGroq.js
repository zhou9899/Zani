// checkGroq.js
import fetch from "node-fetch";

const key = "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"; // paste your Groq key here

async function checkKey() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": `Bearer ${key}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Key is valid!");
      console.log("Available models:", data.data.map(m => m.id));
    } else {
      console.log("❌ Invalid key or request failed");
      console.log("Status:", res.status);
      console.log(await res.text());
    }
  } catch (err) {
    console.error("⚠️ Error:", err.message);
  }
}

checkKey();

