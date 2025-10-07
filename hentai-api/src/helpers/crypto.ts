import crypto from "crypto";

export function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
