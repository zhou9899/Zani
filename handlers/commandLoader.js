import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(sock, commandsPath) {
  global.commands = {};
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  let loadedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    if (file.toLowerCase().includes("helpers")) continue;

    try {
      const fileUrl = pathToFileURL(path.join(commandsPath, file)).href;
      const cmdModule = await import(fileUrl);
      const command = cmdModule.default || cmdModule;

      if (!command.name || !command.execute) {
        console.warn(`⚠️ Skipping ${file}: missing name or execute`);
        failedCount++;
        continue;
      }

      global.commands[command.name] = command;

      const perms = [];
      if (command.ownerOnly) perms.push("Owner");
      if (command.adminOnly) perms.push("Admin");
      console.log(`⚡ Loaded command: ${command.name}${perms.length ? ` [${perms.join(", ")}]` : ""}`);

      loadedCount++;
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
      failedCount++;
    }
  }

  console.log(`📦 Commands loaded: ${loadedCount} successful, ${failedCount} failed`);
  return { loaded: loadedCount, failed: failedCount };
}
