/**
 * Credential encryption at rest (AES-256-GCM). OAuth tokens are encrypted before
 * storage and never exposed to the client (rule #10). The key is derived from
 * CREDENTIAL_ENCRYPTION_KEY; without it, credential storage fails loudly rather
 * than storing secrets in plaintext.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

function getKey(): Buffer | null {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw || raw.startsWith("your-") || raw.startsWith("dummy-")) return null;
  return createHash("sha256").update(raw).digest(); // 32 bytes
}

export function isEncryptionConfigured(): boolean {
  return getKey() !== null;
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  if (!key) throw new Error("CREDENTIAL_ENCRYPTION_KEY is not set; refusing to store credentials in plaintext.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  if (!key) throw new Error("CREDENTIAL_ENCRYPTION_KEY is not set; cannot decrypt credentials.");
  const [ivB, tagB, ctB] = payload.split(":");
  if (!ivB || !tagB || !ctB) throw new Error("Malformed encrypted credential payload.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB, "base64")), decipher.final()]).toString("utf8");
}
