export const name = "pint"; // Required for command loader

export async function execute(sock, message, args) {
    const jid = message.key?.remoteJid || message.key?.participant;
    if (!jid || typeof jid !== "string") {
        console.error("Invalid jid:", message.key);
        return;
    }

    if (!args.length) {
        return await sock.sendMessage(jid, { text: "Usage: .pint <search terms>" });
    }

    const query = args.join(" ");
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

    try {
        // fetch Pinterest page HTML
        const res = await global.axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 12; Mobile) Chrome/108.0.0.0 Safari/537.36",
            },
        });

        // extract pin images from HTML
        const matches = [...res.data.matchAll(/https:\/\/i\.pinimg\.com\/[^"]+/g)];
        const images = matches
            .map(m => m[0])
            .filter(src => !src.includes("236x")); // skip low-quality

        if (!images.length) {
            return await sock.sendMessage(jid, { text: "No images found." });
        }

        // send top 5 images
        for (let i = 0; i < Math.min(5, images.length); i++) {
            try {
                const imgRes = await global.axios.get(images[i], { responseType: "arraybuffer" });
                await sock.sendMessage(jid, { image: imgRes.data, caption: query });
            } catch (fetchErr) {
                console.error("Image fetch failed:", fetchErr.message);
            }
        }
    } catch (err) {
        console.error("Pinterest fetch error:", err);
        await sock.sendMessage(jid, { text: `Error fetching Pinterest images: ${err.message}` });
    }
}
