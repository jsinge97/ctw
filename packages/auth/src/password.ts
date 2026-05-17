import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCHEME = "scrypt-v1";
const KEY_LENGTH = 64;

export function hashPassword(password: string, salt = randomBytes(16).toString("base64url")): string {
  if (password.length === 0) throw new Error("Password is required");
  return `${SCHEME}$${salt}$${scryptSync(password, salt, KEY_LENGTH).toString("base64url")}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [scheme, salt, encodedKey] = passwordHash.split("$");
  if (scheme !== SCHEME || !salt || !encodedKey) return false;

  const actual = Buffer.from(scryptSync(password, salt, KEY_LENGTH).toString("base64url"));
  const expected = Buffer.from(encodedKey);
  if (actual.byteLength !== expected.byteLength) return false;
  return timingSafeEqual(actual, expected);
}

