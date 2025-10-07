import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, "commands");

console.log("🔍 Checking ALL command files for syntax errors...");

const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
let errorFound = false;

for (const file of files) {
    try {
        const filePath = path.join(commandsPath, file);
        await import(filePath);
        console.log(`✅ ${file} - OK`);
    } catch (error) {
        console.log(`❌ ${file} - SYNTAX ERROR: ${error.message}`);
        errorFound = true;
    }
}

if (!errorFound) {
    console.log("🎉 All command files passed syntax check!");
} else {
    console.log("\n💡 Delete or fix the files marked with ❌ above");
}
