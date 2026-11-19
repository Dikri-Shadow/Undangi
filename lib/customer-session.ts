import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "undangi_customer_session";
export const RECIPIENT_SESSION_COOKIE = "undangi_recipient_session";
export const CUSTOMER_ABSOLUTE_TTL = 7 * 24 * 60 * 60;
export const CUSTOMER_IDLE_TTL = 24 * 60 * 60;
/** Default cap on active sessions per (wedding, subject); see docs/customer-session-policy.md. */
export const CUSTOMER_SESSION_DEVICE_LIMIT_DEFAULT = 3;

/**
 * Kill-switch for the legacy wedding-wide customer token (table
 * wedding_guest_access). Default ON for backwards compatibility; set
 * LEGACY_CUSTOMER_TOKEN_ENABLED=false to disable it (requires Zeke's
 * approval + migration 202611180001 applied, see docs/customer-session-policy.md).
 */
export function isLegacyCustomerTokenEnabled() {
  return process.env.LEGACY_CUSTOMER_TOKEN_ENABLED !== "false";
}

/** Max active sessions per subject, from env CUSTOMER_SESSION_DEVICE_LIMIT (default 3). */
export function getCustomerSessionDeviceLimit() {
  const parsed = Number(process.env.CUSTOMER_SESSION_DEVICE_LIMIT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : CUSTOMER_SESSION_DEVICE_LIMIT_DEFAULT;
}

/** Stable device fingerprint: SHA-256 hex (64 chars) of the User-Agent string. */
export function hashDeviceFingerprint(userAgent: string | null | undefined) {
  return createHash("sha256").update(userAgent || "unknown", "utf8").digest("hex").slice(0, 64);
}

export type CustomerSessionRow = { id: string; last_seen_at: string };

/**
 * Pure eviction picker: given the active (non-revoked) sessions for one
 * subject ordered oldest-first, return the ids to revoke so a new session
 * fits under `limit`. Returns [] when there is room.
 */
export function selectCustomerSessionsToEvict(
  activeSessionsOldestFirst: CustomerSessionRow[],
  limit: number,
) {
  if (activeSessionsOldestFirst.length < limit) return [] as string[];
  return activeSessionsOldestFirst
    .slice(0, activeSessionsOldestFirst.length - limit + 1)
    .map((row) => row.id);
}

function key() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Customer session secret unavailable");
  return createHash("sha256").update(`undangi-customer-session:${secret}`).digest();
}
function mac(value: string) { return createHash("sha256").update(`${value}:${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`).digest("hex"); }

export function sealCustomerSession(slug: string, token: string, now = Date.now(), issuedAt = now) {
  const payload = JSON.stringify({ slug, token, issuedAt, lastSeenAt: now, nonce: randomBytes(16).toString("hex") });
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv); const body = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url"), mac(payload)].join(".");
}

export function openCustomerSession(value: string, now = Date.now()) {
  try {
    const [ivText, tagText, bodyText, signature] = value.split("."); if (!ivText || !tagText || !bodyText || !signature) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url")); decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    const payload = Buffer.concat([decipher.update(Buffer.from(bodyText, "base64url")), decipher.final()]).toString("utf8");
    const expected = Buffer.from(mac(payload), "utf8"); const actual = Buffer.from(signature, "utf8"); if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const parsed = JSON.parse(payload) as { slug: string; token: string; issuedAt: number; lastSeenAt: number; nonce: string };
    if (!parsed.slug || !parsed.token || now - parsed.issuedAt > CUSTOMER_ABSOLUTE_TTL * 1000 || now - parsed.lastSeenAt > CUSTOMER_IDLE_TTL * 1000) return null;
    return parsed;
  } catch { return null; }
}

export function sealRecipientSession(slug: string, recipientId: string, token: string, now = Date.now(), issuedAt = now) {
  const payload = JSON.stringify({ slug, recipientId, token, issuedAt, lastSeenAt: now, nonce: randomBytes(16).toString("hex") });
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv); const body = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url"), mac(payload)].join(".");
}

export function openRecipientSession(value: string, now = Date.now()) {
  const parsed = openCustomerSession(value, now) as ({ slug: string; token: string; issuedAt: number; lastSeenAt: number } | null);
  if (!parsed) return null;
  try {
    const [ivText, tagText, bodyText, signature] = value.split("."); if (!ivText || !tagText || !bodyText || !signature) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url")); decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    const payload = Buffer.concat([decipher.update(Buffer.from(bodyText, "base64url")), decipher.final()]).toString("utf8");
    const recipient = JSON.parse(payload) as { slug: string; recipientId: string; token: string; issuedAt: number; lastSeenAt: number };
    return recipient.recipientId && recipient.slug ? recipient : null;
  } catch { return null; }
}
