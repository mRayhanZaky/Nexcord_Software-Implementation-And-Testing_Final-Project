import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function normalizeSecret(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function hashSecretAnswer(answer) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(normalizeSecret(answer), salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecretAnswer(answer, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.scryptSync(normalizeSecret(answer), salt, KEY_LENGTH);
  const original = Buffer.from(originalHash, "hex");

  return original.length === hash.length && crypto.timingSafeEqual(original, hash);
}
