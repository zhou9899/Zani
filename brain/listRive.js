// brain/listRive.js
import fs from "fs";
import path from "path";

// Store all Rive files here
const brain = {};

// Load all .rive files in this folder
const files = fs.readdirSync(path.resolve("./brain")).filter(f => f.endsWith(".rive"));

for (const file of files) {
    const name = file.replace(".rive", "");
    const content = fs.readFileSync(path.resolve("./brain", file), "utf-8");
    brain[name] = content;
    console.log(`🧠 Loaded brain module: ${name}`);
}

// Export the brain object
export default brain;
