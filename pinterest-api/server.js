import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
};

// Extract Pinterest images from HTML
function extractImages(html) {
    const urls = new Set();
    const regex = /"url":"(https:\/\/i\.pinimg\.com\/[^"]+\.(jpg|jpeg|png|webp))"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.add(match[1].replace(/\\\//g, '/'));
    }
    return Array.from(urls).slice(0, 5); // top 5 images
}

// API endpoint
app.get('/api/pinterest', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query "q"' });

    try {
        const response = await axios.get(
            `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
            { headers: HEADERS }
        );

        const images = extractImages(response.data);
        if (!images.length) return res.status(404).json({ error: 'No images found' });

        res.json({ images, count: images.length, query });
    } catch (err) {
        console.error('Pinterest scraping error:', err.message);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Pinterest API running on port ${PORT}`));
