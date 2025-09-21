import fetch from "node-fetch";
import dotenv from "dotenv";

// Load your Pinterest token
dotenv.config({ path: "./.env.pinterest" });

const ACCESS_TOKEN = process.env.PINTEREST_TOKEN;

if (!ACCESS_TOKEN) {
  console.log("❌ No token found in .env.pinterest");
  process.exit(1);
}

async function checkToken() {
  try {
    const url = `https://api.pinterest.com/v5/user_account`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Token is valid!");
      console.log("User info:", data);
    } else {
      console.log(`❌ Token invalid or expired. Status: ${res.status}`);
      const text = await res.text();
      console.log("Response:", text);
    }
  } catch (err) {
    console.error("❌ Error checking token:", err);
  }
}

checkToken();

