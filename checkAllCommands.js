// checkAllCommands.js
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const commandsPath = path.join(process.cwd(), "commands");

if (!fs.existsSync(commandsPath)) {
  console.error("❌ Commands folder not found:", commandsPath);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

async function checkFile(file) {
  return new Promise((resolve) => {
    exec(`node --check "${path.join(commandsPath, file)}"`, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Syntax error in ${file}:\n${stderr}`);
      } else {
        console.log(`✅ ${file} passed syntax check`);
      }
      resolve();
    });
  });
}

(async () => {
  for (const file of commandFiles) {
    await checkFile(file);
  }
  console.log("✅ All commands checked");
})();
