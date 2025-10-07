import "dotenv/config";

// ----------------------- Mock Providers ----------------------- //

function randomId(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

async function fetchHanime(query: string): Promise<string> {
  console.log(`[MOCK] fetchHanime called with query: ${query}`);
  return `https://hanime.mock/${encodeURIComponent(query)}-${randomId()}.mp4`;
}

async function fetchHentaiHaven(query: string): Promise<string> {
  console.log(`[MOCK] fetchHentaiHaven called with query: ${query}`);
  return `https://hentaihaven.mock/${encodeURIComponent(query)}-${randomId()}.mp4`;
}

async function fetchRule34(query: string): Promise<string> {
  console.log(`[MOCK] fetchRule34 called with query: ${query}`);
  return `https://rule34.mock/${encodeURIComponent(query)}-${randomId()}.jpg`;
}

// ----------------------- Command ----------------------- //

async function hentaiCommand(
  m: { reply: (msg: string) => Promise<void> },
  args: string[],
  provider: "hanime" | "hentai-haven" | "rule34"
) {
  try {
    const query = args.length > 0 ? args.join(" ") : "milf";
    let url: string;

    if (provider === "hanime") url = await fetchHanime(query);
    else if (provider === "hentai-haven") url = await fetchHentaiHaven(query);
    else url = await fetchRule34(query);

    await m.reply(`🎬 *${query}*\n🔗 ${url}`);
  } catch (err) {
    console.error("Hentai command error:", err);
    m.reply("❌ Error fetching content.");
  }
}

// ----------------------- Bot ----------------------- //

interface Message {
  text?: string;
  reply: (text: string) => Promise<void>;
}

const bot = {
  onMessage: async (handler: (m: Message) => Promise<void>) => {
    // Example test messages
    await handler({ text: ".hentai yaoi", reply: async (msg) => console.log("[BOT REPLY]", msg) });
    await handler({ text: ".hentaihaven lolicon", reply: async (msg) => console.log("[BOT REPLY]", msg) });
    await handler({ text: ".rule34 futanari", reply: async (msg) => console.log("[BOT REPLY]", msg) });
  },
};

bot.onMessage(async (m: Message) => {
  const text = m.text || "";
  const args = text.split(" ").slice(1);

  if (text.startsWith(".hentai")) await hentaiCommand(m, args, "hanime");
  else if (text.startsWith(".hentaihaven")) await hentaiCommand(m, args, "hentai-haven");
  else if (text.startsWith(".rule34")) await hentaiCommand(m, args, "rule34");
});
