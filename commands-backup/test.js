export const name = "test";
export const description = "Check bot latency (ms)";
export async function execute(sock, msg) {
  const start = Date.now();
  await sock.sendMessage(msg.key.remoteJid, { text: "Checking..." });
  const end = Date.now();
  const latency = end - start;
  await sock.sendMessage(msg.key.remoteJid, { text: `Yare Yare!\n> ${latency}ms` });
}
