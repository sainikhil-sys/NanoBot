/**
 * Webhook intake helpers: secret generation, HMAC signature verification and
 * deterministic event-id derivation.
 *
 * Signature scheme (when a webhook secret is configured on the automation):
 *   header `x-nanobot-signature: sha256=<hex HMAC-SHA256(rawBody, secret)>`
 * Verification is constant-time. Senders may also pass `x-nanobot-event-id` to
 * control idempotency; otherwise the id is derived from the raw body.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function generateWebhookSecret(): string {
  return "whsec_" + randomBytes(24).toString("hex");
}

export function signPayload(rawBody: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Constant-time comparison of a provided signature against the expected one. */
export function verifySignature(rawBody: string, secret: string, provided: string | null): boolean {
  if (!provided) return false;
  const expected = signPayload(rawBody, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Derive a stable event id: prefer a caller-supplied id, else hash the body. */
export function deriveEventId(rawBody: string, headerEventId: string | null): string {
  if (headerEventId && headerEventId.trim()) return headerEventId.trim();
  return "evt_" + createHmac("sha256", "nanobot-event").update(rawBody, "utf8").digest("hex").slice(0, 32);
}

export interface WebhookDelivery {
  id: string;
  automationId: string;
  eventId: string;
  status: "accepted" | "duplicate" | "rejected" | "error";
  runId?: string;
  reason?: string;
  receivedAt: string;
}
