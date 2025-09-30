import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(sock, commandsPath) {
  global.commands = {};
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  let loadedCount = 0;
  let failedCount = 0;

  const loadTasks = files
    .filter(file => !file.toLowerCase().includes("helpers"))
    .map(async file => {
      try {
        const fileUrl = pathToFileURL(path.join(commandsPath, file)).href;
        const cmdModule = await import(fileUrl);

        // Support both default export AND named exports
        let command;
        if (cmdModule.default) {
          // Default export: { name, description, execute }
          command = cmdModule.default;
        } else if (cmdModule.name && cmdModule.execute) {
          // Named exports: export const name, export function execute
          command = {
            name: cmdModule.name,
            description: cmdModule.description || "No description",
            execute: cmdModule.execute
          };
        } else {
          console.warn(`⚠️ Skipping ${file}: invalid export format`);
          return { ok: false };
        }

        if (!command.name || !command.execute) {
          console.warn(`⚠️ Skipping ${file}: missing name or execute`);
          return { ok: false };
        }

        global.commands[command.name] = command;

        const perms = [];
        if (command.ownerOnly) perms.push("Owner");
        if (command.adminOnly) perms.push("Admin");
        console.log(`⚡ Loaded command: ${command.name}${perms.length ? ` [${perms.join(", ")}]` : ""}`);

        return { ok: true };
      } catch (err) {
        console.error(`❌ Failed to load command ${file}:`, err.message);
        return { ok: false };
      }
    });

  const results = await Promise.all(loadTasks);
  results.forEach(r => (r.ok ? loadedCount++ : failedCount++));

  console.log(`📦 Commands loaded: ${loadedCount} successful, ${failedCount} failed`);
  return { loaded: loadedCount, failed: failedCount };
}
