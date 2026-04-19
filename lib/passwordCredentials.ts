import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;
const PREFIX = "scrypt$";

function parseStored(stored: string): { salt: Buffer; hash: Buffer } | null {
  if (!stored.startsWith(PREFIX)) return null;
  const rest = stored.slice(PREFIX.length);
  const [saltB64, hashB64] = rest.split("$");
  if (!saltB64 || !hashB64) return null;
  try {
    return { salt: Buffer.from(saltB64, "base64"), hash: Buffer.from(hashB64, "base64") };
  } catch {
    return null;
  }
}

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN);
  return `${PREFIX}${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parsed = parseStored(stored);
  if (!parsed) return false;
  const candidate = scryptSync(plain, parsed.salt, parsed.hash.length);
  if (candidate.length !== parsed.hash.length) return false;
  return timingSafeEqual(candidate, parsed.hash);
}
