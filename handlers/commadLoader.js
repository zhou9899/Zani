// handlers/commandLoader.js
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(sock, commandsPath) {
  global.commands = {};
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  let loadedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    if (file.toLowerCase().includes("helpers") || file.toLowerCase().includes("loadimage")) continue;

    try {
      const fileUrl = pathToFileURL(path.join(commandsPath, file)).href;
      const cmdModule = await import(fileUrl);
      const command = cmdModule.default || cmdModule;

      if (!command.name || !command.execute) {
        console.warn(`⚠️ Skipping ${file}: missing name or execute`);
        failedCount++;
        continue;
      }

      // ✅ REMOVED the NSFW wrapper block - handling is done in messageHandler.js

      global.commands[command.name] = command;

      const permissions = [];
      if (command.ownerOnly) permissions.push("Owner");
      if (command.adminOnly) permissions.push("Admin");
      const permString = permissions.length ? ` [${permissions.join(", ")}]` : '';
      console.log(`⚡ Loaded command: ${command.name}${permString}`);

      loadedCount++;
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
      failedCount++;
    }
  }

  console.log(`📦 Commands loaded: ${loadedCount} successful, ${failedCount} failed`);
  return { loaded: loadedCount, failed: failedCount };
}
