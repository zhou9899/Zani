import { Jimp } from "jimp";

async function main() {
  try {
    // Create blank 128x128 red image
    const image = await Jimp.Jimp.create({ width: 128, height: 128, background: 0xff0000ff });

    // Resize example
    await image.resize(64, 64);

    // Save to disk
    await image.save("test-output.png");

    console.log("🎉 Image created: test-output.png");
  } catch (err) {
    console.error("❌ Jimp test failed:", err);
  }
}

main();
