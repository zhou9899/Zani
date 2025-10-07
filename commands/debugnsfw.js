// commands/debugnsfw.js
export default {
  name: "debugnsfw",
  description: "Debug NSFW status for this group",
  adminOnly: true,
  nsfw: false,

  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid.replace(/@g\.us.*$/, "@g.us");
    const nsfwStatus = global.groupNSFW.get(groupId) || false;
    
    const allGroups = [...global.groupNSFW].map(([id, status]) => 
      `${id} = ${status}${id === groupId ? " (THIS GROUP)" : ""}`
    ).join("\n");
    
    return sock.sendMessage(msg.key.remoteJid, { 
      text: `🔍 NSFW DEBUG INFO:
Current Group: ${groupId}
NSFW Status: ${nsfwStatus ? "ENABLED ✅" : "DISABLED ❌"}

All Groups in Memory:
${allGroups || "None"}`
    }, { quoted: msg });
  },
};
