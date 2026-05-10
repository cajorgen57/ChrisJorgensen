import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// AES-256-GCM. Plaid access tokens are stored encrypted at rest using
// APP_SECRET as the key material. Even on a single-user local install this
// reduces the blast radius if the SQLite file is ever copied off the machine.

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const SALT = "chrisjorgensen.tracker.v1"; // domain-separated key derivation

function getKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "APP_SECRET is missing or too short. Set a 32+ char value in .env (see .env.example)."
    );
  }
  return scryptSync(secret, SALT, 32);
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed ciphertext payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}
