// commands/weather.js
export const name = "weather";
export const description = "Get current weather info 🌤️";

const API_KEY = "a146a545fd7f4a6cb9882ae952296c61"; // Your OpenWeatherMap API key

export async function execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!args.length) {
        return sock.sendMessage(
            jid,
            { text: "❌ Usage: .weather <city>" },
            { quoted: msg }
        );
    }

    const city = args.join(" ");
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== 200) {
            return sock.sendMessage(
                jid,
                { text: `⚠️ Could not find weather for *${city}*` },
                { quoted: msg }
            );
        }

        const weather = data.weather[0];
        const main = data.main;
        const wind = data.wind;

        const weatherMsg = `
╔═════ 🌑 Weather Report 🌑 ═════╗
📍 Location: *${data.name}, ${data.sys.country}*
🌡️ Temp: *${main.temp}°C* (Feels: ${main.feels_like}°C)
🌦️ Condition: *${weather.description}*
💧 Humidity: *${main.humidity}%*
🌬️ Wind: *${wind.speed} m/s*
╚══════════════════════════════╝
        `.trim();

        await sock.sendMessage(
            jid,
            { text: weatherMsg },
            { quoted: msg } // 👈 Only reply to their message, no tag
        );
    } catch (err) {
        console.error("❌ Weather command error:", err);
        await sock.sendMessage(
            jid,
            { text: "⚠️ Failed to fetch weather. Try again later." },
            { quoted: msg }
        );
    }
}
