import play from "play-dl";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import path from "path";

const query = process.argv.slice(2).join(" "); // Pass search query in terminal

if (!query) {
    console.log("❌ Please provide a search query.");
    process.exit(1);
}

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const tempAudio = path.join(tempDir, `audio-${Date.now()}.mp3`);

async function testPlay() {
    try {
        console.log(`🔍 Searching YouTube for: "${query}"`);
        const results = await play.search(query, { limit: 1 });

        if (!results.length) {
            console.log("❌ No results found.");
            return;
        }

        const video = results[0];
        console.log("🎬 Found:", video.title);
        console.log("🔗 URL:", video.url);

        console.log("⬇️ Downloading audio...");
        await youtubedl(video.url, {
            extractAudio: true,
            audioFormat: "mp3",
            audioQuality: "4",
            output: tempAudio,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            socketTimeout: 30000,
            retries: 3,
        });

        console.log("✅ Audio downloaded to:", tempAudio);

        // Cleanup
        fs.unlinkSync(tempAudio);
        console.log("🧹 Temporary file cleaned up.");

    } catch (err) {
        console.error("❌ Error:", err);
    }
}

testPlay();
