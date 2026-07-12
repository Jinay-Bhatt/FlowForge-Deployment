import crypto from "node:crypto";
import { config } from "../config/index.js";

const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts a plaintext string using AES-256-GCM and the encryption key from configs.
 * Returns string format: iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  const key = Buffer.from(config.encryptionKey, "hex");
  const iv = crypto.randomBytes(12); // GCM standard IV is 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string back to plaintext.
 */
export function decrypt(text: string): string {
  const key = Buffer.from(config.encryptionKey, "hex");
  const [ivHex, authTagHex, encryptedHex] = text.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted text structure");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
