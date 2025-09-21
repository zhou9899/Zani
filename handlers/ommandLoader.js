// handlers/commandLoader.js
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(sock, commandsPath) {
    global.commands = {};
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith>
                                                                          for (const file of files) {
        try {                                                                     const fileUrl = pathToFileURL(path.join(commandsPath, fil>
            const cmd = await import(fileUrl);

            if (!cmd.name || !cmd.execute) continue;                  
            global.commands[cmd.name] = { name: cmd.name, execute: cm>
            console.log(`⚡ Loaded command: ${cmd.name}`);
        } catch (err) {
            console.error(`❌ Failed to load command ${file}:`, err);
        }
    }
}

                                     
