import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const categories = [
  { label: "LUCK", emoji: "🍀", color: "#4CAF50" },
  { label: "LOVE", emoji: "💖", color: "#E91E63" },
  { label: "CAREER", emoji: "💼", color: "#2196F3" },
  { label: "HEALTH", emoji: "🩺", color: "#FF9800" },
  { label: "FRIENDSHIP", emoji: "🤝", color: "#9C27B0" },
];

const fortunes = [
  "Unexpected joy is coming your way 🌈",
  "A great opportunity will appear soon 🚀",
  "Your hard work will pay off beautifully 💫",
  "Love is just around the corner 💖",
  "Financial abundance is heading your way 💰",
  "Your creativity will blossom this week 🎨",
  "A pleasant surprise awaits you 🎁",
  "Your dreams are closer than they appear ✨",
  "Success is in your near future 🌟",
  "Happiness will find you unexpectedly 😊"
];

const inspirations = [
  "Small steps lead to big changes. 🌱",
  "Believe in yourself and magic happens. 🔮",
  "Every moment is a fresh beginning. 🌅",
  "Your smile can change the world. 😊",
  "Good things take time, stay patient. ⏳",
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default {
  name: "fortune",
  description: "Generate a beautiful fortune card",
  ownerOnly: false,
  adminOnly: false,
  async execute(sock, msg, args) {
    try {
      const category = randomChoice(categories);
      const fortune = randomChoice(fortunes);
      const inspiration = randomChoice(inspirations);

      // Simple and reliable chart configuration
      const chartConfig = {
        type: 'doughnut',
        data: {
          labels: ['Fortune'],
          datasets: [{
            data: [100],
            backgroundColor: [category.color],
            borderWidth: 0
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          legend: { display: false },
          tooltips: { enabled: false },
          title: {
            display: true,
            text: [
              '🔮 MAGICAL FORTUNE CARD 🔮',
              '',
              `${category.emoji} ${category.label} ${category.emoji}`,
              '',
              '━━━━━━━━━━━━━━',
              '',
              `${fortune}`,
              '',
              '━━━━━━━━━━━━━━',
              '',
              `✨ ${inspiration}`,
              '',
              `📅 ${new Date().toLocaleDateString()}`,
              '',
              '🌟 Stay Blessed 🌟'
            ],
            fontSize: 18,
            fontColor: '#FFFFFF',
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1.6,
            padding: 25
          },
          rotation: 0,
          circumference: 2 * Math.PI,
          cutout: '0%'
        }
      };

      // Encode the configuration properly
      const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
      const chartUrl = `https://quickchart.io/chart?width=500&height=600&backgroundColor=linear-gradient(135deg,${encodeURIComponent('#667eea')},${encodeURIComponent('#764ba2')})&c=${encodedConfig}`;

      console.log("Fetching chart from:", chartUrl);

      const response = await fetch(chartUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.buffer();

      // Save file temporarily
      const fileName = `fortune_${Date.now()}.png`;
      const filePath = path.join(process.cwd(), "downloads", fileName);
      
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      
      fs.writeFileSync(filePath, buffer);

      // Send the image
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: filePath },
        caption: `🔮 *${category.label} Fortune*\n\n${fortune}\n\n✨ ${inspiration}`,
      }, { quoted: msg });

      // Clean up
      fs.unlinkSync(filePath);

    } catch (err) {
      console.error("❌ Error in .fortune command:", err);
      
      // Fallback: Send text fortune
      const category = randomChoice(categories);
      const fortune = randomChoice(fortunes);
      const inspiration = randomChoice(inspirations);
      
      const textFortune = `
🔮 *MAGICAL FORTUNE CARD* 🔮

${category.emoji} *${category.label} Fortune* ${category.emoji}

📜 ${fortune}

✨ ${inspiration}

📅 ${new Date().toLocaleDateString()}

💫 *Stay blessed!* 💫
      `.trim();

      await sock.sendMessage(msg.key.remoteJid, { 
        text: textFortune 
      }, { quoted: msg });
    }
  }
};
