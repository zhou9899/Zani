// pinterest-server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// Simple CORS middleware so bot/front-end can fetch
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// API endpoint: /api/search?query=...
app.get("/api/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    // Fetch Pinterest search page HTML
    const html = await fetch(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`)
      .then(r => r.text());

    // Extract image URLs
    const matches = [...html.matchAll(/"url":"(https:\/\/i\.pinimg\.com[^"]+)"/g)];
    const pins = matches.slice(0, 10).map((m, i) => ({
      image: m[1].replace(/\\u002F/g, "/"),
      title: `${query} #${i+1}`,
      description: `Pinterest image result #${i+1}`,
      url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
    }));

    if (!pins.length) return res.json([]);

    res.json(pins);

  } catch (err) {
    console.error("Pinterest scrape error:", err);
    res.status(500).json({ error: "Failed to fetch Pinterest images" });
  }
});

app.listen(PORT, () => {
  console.log(`📌 Pinterest scraper running on http://localhost:${PORT}`);
});

