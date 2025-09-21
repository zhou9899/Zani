// helpers/groupSettings.js
import fs from "fs";
import path from "path";

const groupSettingsPath = path.join(process.cwd(), "group-settings.json");

export function loadGroupSettings() {
    try {
        if (fs.existsSync(groupSettingsPath)) {
            return JSON.parse(fs.readFileSync(groupSettingsPath, "utf-8"));
        }
    } catch (error) {
        console.error("Error loading group settings:", error);
    }
    return {};
}
