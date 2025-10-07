// utils/permissions.js
export async function hasPermission(sock, groupJid, senderJid) {
  const metadata = await sock.groupMetadata(groupJid);
  const participant = metadata.participants.find(p => p.id === senderJid);

  const isOwner = global.owners.includes(senderJid.split("@")[0]);
  const isMod = global.moderators.includes(senderJid.split("@")[0]);
  const isAdmin = participant?.admin;

  return isOwner || isMod || Boolean(isAdmin);
}

export function normalizeNumber(number) {
  return number.replace(/\D/g, "");
}
