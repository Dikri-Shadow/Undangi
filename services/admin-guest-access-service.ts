import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdminEnv } from "@/lib/supabase-env";
import { isLegacyCustomerTokenEnabled } from "@/lib/customer-session";

let legacyDeprecationWarned = false;

export type GuestAccessStatus = { active: boolean; id?: string; tokenVersion?: number; createdAt?: string; revokedAt?: string | null };

function adminUrl(path: string) {
  const env = getSupabaseAdminEnv();
  if (!env) throw new Error("Supabase admin belum dikonfigurasi.");
  return { env, url: `${env.url}${path}` };
}

function headers(env: ReturnType<typeof getSupabaseAdminEnv>) {
  return { apikey: env!.serviceRoleKey, Authorization: `Bearer ${env!.serviceRoleKey}`, "Content-Type": "application/json" };
}

export function createCustomerToken() {
  // Token pendek (12 byte -> 16 karakter base64url, 96 bit) supaya link
  // personal tamu tidak terlalu panjang. 96 bit jauh di atas yang
  // dibutuhkan untuk token acak yang divalidasi server + rate limit.
  // Hanya hash yang disimpan di DB, jadi panjang token lama (43 karakter)
  // yang sudah diterbitkan tetap valid — validasi hanya membandingkan hash.
  const raw = randomBytes(12).toString("base64url");
  const hash = createHash("sha256").update(raw, "utf8").digest("hex");
  return { raw, hash };
}

export function hashCustomerToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Legacy wedding-wide customer token (table wedding_guest_access, one token
 * covering every recipient of a wedding).
 * @deprecated Use personal owner tokens in wedding_customer_access
 * (createCustomerAccess / validateCustomerAccess) instead. This function
 * returns false once LEGACY_CUSTOMER_TOKEN_ENABLED=false; until then it
 * logs a once-per-process deprecation warning.
 */
export async function validateCustomerToken(slug: string, token: string) {
  if (!isLegacyCustomerTokenEnabled()) return false;
  if (!legacyDeprecationWarned) {
    legacyDeprecationWarned = true;
    console.warn("[guest-access] legacy-customer-token-deprecated: wedding-wide customer tokens are deprecated; migrate to personal owner tokens (wedding_customer_access) and set LEGACY_CUSTOMER_TOKEN_ENABLED=false");
  }
  const hash = hashCustomerToken(token);
  const { env, url } = adminUrl(`/rest/v1/wedding_guest_access?wedding_slug=eq.${encodeURIComponent(slug)}&token_hash=eq.${hash}&revoked_at=is.null&select=id,wedding_slug&limit=1`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Guest access validation failed");
  const rows = await response.json() as Array<{ id: string; wedding_slug: string }>;
  return rows.length === 1 && rows[0].wedding_slug === slug;
}

export type CustomerAccessStatus = { id: string; label: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null; active: boolean };

/** Personal owner token (table wedding_customer_access, migration 202611180001). Returns the raw token ONCE; only its hash is stored. */
export async function createCustomerAccess(slug: string, label: string) {
  const token = createCustomerToken();
  const { env, url } = adminUrl("/rest/v1/wedding_customer_access");
  const response = await fetch(url, { method: "POST", headers: { ...headers(env), Prefer: "return=representation" }, body: JSON.stringify({ wedding_slug: slug, label: label.trim() || "owner", token_hash: token.hash }), cache: "no-store" });
  if (!response.ok) throw new Error("Customer access create failed");
  const [row] = await response.json() as Array<{ id: string; label: string; created_at: string }>;
  return { id: row.id, label: row.label, token: token.raw, createdAt: row.created_at };
}

/** Lists personal owner tokens WITHOUT hashes or raw tokens. */
export async function listCustomerAccess(slug: string): Promise<CustomerAccessStatus[]> {
  const { env, url } = adminUrl(`/rest/v1/wedding_customer_access?wedding_slug=eq.${encodeURIComponent(slug)}&select=id,label,created_at,last_used_at,revoked_at&order=created_at.desc`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Customer access lookup failed");
  return (await response.json() as Array<{ id: string; label: string; created_at: string; last_used_at: string | null; revoked_at: string | null }>).map((row) => ({ id: row.id, label: row.label, createdAt: row.created_at, lastUsedAt: row.last_used_at, revokedAt: row.revoked_at, active: row.revoked_at === null }));
}

export async function revokeCustomerAccess(slug: string, id: string) {
  const { env, url } = adminUrl(`/rest/v1/wedding_customer_access?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(id)}&revoked_at=is.null`);
  const response = await fetch(url, { method: "PATCH", headers: { ...headers(env), Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: new Date().toISOString() }), cache: "no-store" });
  if (!response.ok) throw new Error("Customer access revoke failed");
}

/**
 * Validates a personal owner token against wedding_customer_access.
 * Returns false (instead of throwing) when the table is not deployed yet
 * (404), so customer sessions keep working on the legacy token until
 * migration 202611180001 is applied.
 */
export async function validateCustomerAccess(slug: string, token: string) {
  const hash = hashCustomerToken(token);
  const { env, url } = adminUrl(`/rest/v1/wedding_customer_access?wedding_slug=eq.${encodeURIComponent(slug)}&token_hash=eq.${encodeURIComponent(hash)}&revoked_at=is.null&select=id&limit=1`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error("Customer access validation failed");
  const valid = (await response.json() as unknown[]).length === 1;
  if (valid) {
    try {
      await fetch(url.split("?")[0] + `?wedding_slug=eq.${encodeURIComponent(slug)}&token_hash=eq.${encodeURIComponent(hash)}&revoked_at=is.null`, { method: "PATCH", headers: { ...headers(env), Prefer: "return=minimal" }, body: JSON.stringify({ last_used_at: new Date().toISOString() }), cache: "no-store" });
    } catch { /* last_used_at is best-effort; validation already succeeded */ }
  }
  return valid;
}

/** Customer session token check: personal owner token first, legacy token second. */
export async function validateCustomerSessionToken(slug: string, token: string) {
  try {
    if (await validateCustomerAccess(slug, token)) return true;
  } catch {
    // Personal-token store unavailable (e.g. table not deployed yet): fall through to legacy.
  }
  return validateCustomerToken(slug, token);
}

export type RecipientWithRsvp = {
  id: string;
  guestName: string;
  createdAt: string;
  updatedAt: string;
  rsvp: { attendance: "hadir" | "tidak"; guestCount: number; message: string | null; createdAt: string } | null;
};

/** Active recipients of a wedding joined with their latest RSVP (if any), mirroring listAdminRecipientsForWedding. */
export async function listRecipientsWithRsvp(slug: string): Promise<RecipientWithRsvp[]> {
  const { env } = adminUrl("");
  const base = `${env.url}/rest/v1/`;
  const [recipientsResponse, rsvpResponse] = await Promise.all([
    fetch(`${base}wedding_recipients?select=id,guest_name,created_at,updated_at&wedding_slug=eq.${encodeURIComponent(slug)}&deleted_at=is.null&order=created_at.asc`, { headers: headers(env), cache: "no-store" }),
    fetch(`${base}wedding_rsvp?select=recipient_id,attendance,guest_count,message,created_at&wedding_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc&limit=1000`, { headers: headers(env), cache: "no-store" }),
  ]);
  if (!recipientsResponse.ok || !rsvpResponse.ok) throw new Error("Recipient lookup failed");
  const recipients = await recipientsResponse.json() as Array<{ id: string; guest_name: string; created_at: string; updated_at: string }>;
  const rsvps = await rsvpResponse.json() as Array<{ recipient_id: string | null; attendance: "hadir" | "tidak"; guest_count: number; message: string | null; created_at: string }>;
  const byRecipient = new Map<string, RecipientWithRsvp["rsvp"]>();
  for (const row of rsvps) {
    if (row.recipient_id && !byRecipient.has(row.recipient_id)) {
      byRecipient.set(row.recipient_id, { attendance: row.attendance, guestCount: row.guest_count, message: row.message, createdAt: row.created_at });
    }
  }
  return recipients.map((row) => ({ id: row.id, guestName: row.guest_name, createdAt: row.created_at, updatedAt: row.updated_at, rsvp: byRecipient.get(row.id) ?? null }));
}

/**
 * Returns the verified recipient ({id, guestName}) for a recipient session,
 * or null. RSVP must use this DB-backed name, never the free-form name
 * submitted by the client.
 */
export async function getVerifiedRecipient(slug: string, recipientId: string, token: string) {
  const hash = hashCustomerToken(token);
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(recipientId)}&personal_token_hash=eq.${encodeURIComponent(hash)}&deleted_at=is.null&select=id,guest_name&limit=1`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient validation failed");
  const [row] = await response.json() as Array<{ id: string; guest_name: string }>;
  return row ? { id: row.id, guestName: row.guest_name } : null;
}

export async function listActiveRecipients(slug: string) {
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&deleted_at=is.null&select=id,guest_name,created_at,updated_at&order=created_at.asc`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient lookup failed");
  return response.json() as Promise<Array<{ id: string; guest_name: string; created_at: string; updated_at: string }>>;
}

/**
 * Cocokkan nama tamu dari link ?to=Nama ke recipient di daftar tamu.
 * Dipakai RSVP: nama dari body dicocokkan (tanpa memperhatikan besar
 * kecil huruf dan spasi ganda) supaya RSVP tercatat di recipient yang
 * benar. Mengembalikan null bila nama tidak ada di daftar tamu — RSVP
 * tetap tercatat sebagai baris legacy (tanpa recipient_id).
 */
export async function findRecipientByName(slug: string, name: string) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
  const target = normalize(name);
  if (!target) return null;
  const recipients = await listActiveRecipients(slug);
  const row = recipients.find((item) => normalize(item.guest_name) === target);
  return row ? { id: row.id, guestName: row.guest_name } : null;
}

export async function listGuestAccess(slug: string): Promise<GuestAccessStatus[]> {
  const { env, url } = adminUrl(`/rest/v1/wedding_guest_access?wedding_slug=eq.${encodeURIComponent(slug)}&select=id,token_version,created_at,revoked_at&order=token_version.desc`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Guest access lookup failed");
  return (await response.json() as Array<{ id: string; token_version: number; created_at: string; revoked_at: string | null }>).map((row) => ({ active: row.revoked_at === null, id: row.id, tokenVersion: row.token_version, createdAt: row.created_at, revokedAt: row.revoked_at }));
}

export async function rotateGuestAccess(slug: string, tokenHash: string) {
  const { env, url } = adminUrl("/rest/v1/rpc/rotate_wedding_guest_access");
  const response = await fetch(url, { method: "POST", headers: headers(env), body: JSON.stringify({ p_wedding_slug: slug, p_token_hash: tokenHash }), cache: "no-store" });
  if (!response.ok) {
    const error = new Error("Guest access rotation failed") as Error & { status?: number; code?: string };
    error.status = response.status;
    try { error.code = ((await response.json()) as { code?: string }).code; } catch { /* safe generic error */ }
    throw error;
  }
  const [row] = await response.json() as Array<{ id: string; wedding_slug: string; token_version: number; created_at: string; is_active: boolean }>;
  return { id: row.id, tokenVersion: row.token_version, createdAt: row.created_at, active: row.is_active } satisfies GuestAccessStatus;
}

export async function revokeGuestAccess(slug: string) {
  const { env, url } = adminUrl(`/rest/v1/wedding_guest_access?wedding_slug=eq.${encodeURIComponent(slug)}&revoked_at=is.null`);
  const response = await fetch(url, { method: "PATCH", headers: { ...headers(env), Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: new Date().toISOString() }), cache: "no-store" });
  if (!response.ok) throw new Error("Guest access revoke failed");
}

export type RecipientRow = { id: string; wedding_slug: string; guest_name: string; personal_token_hash: string; created_at: string; updated_at: string; deleted_at: string | null };

export async function createRecipient(slug: string, guestName: string) {
  const token = createCustomerToken();
  const { env, url } = adminUrl("/rest/v1/wedding_recipients");
  const response = await fetch(url, { method: "POST", headers: { ...headers(env), Prefer: "return=representation" }, body: JSON.stringify({ wedding_slug: slug, guest_name: guestName, personal_token_hash: token.hash }), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient create failed");
  const [row] = await response.json() as RecipientRow[];
  return { id: row.id, guestName: row.guest_name, token: token.raw, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function updateRecipient(slug: string, id: string, guestName: string) {
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(id)}&deleted_at=is.null`);
  const response = await fetch(url, { method: "PATCH", headers: { ...headers(env), Prefer: "return=representation" }, body: JSON.stringify({ guest_name: guestName, updated_at: new Date().toISOString() }), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient update failed");
  const [row] = await response.json() as RecipientRow[];
  return row ? { id: row.id, guestName: row.guest_name, createdAt: row.created_at, updatedAt: row.updated_at } : null;
}

export async function revokeRecipient(slug: string, id: string) {
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(id)}&deleted_at=is.null`);
  const response = await fetch(url, { method: "PATCH", headers: { ...headers(env), Prefer: "return=minimal" }, body: JSON.stringify({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient revoke failed");
}

export async function rotateRecipientToken(slug: string, id: string) {
  const token = createCustomerToken();
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(id)}&deleted_at=is.null`);
  const response = await fetch(url, { method: "PATCH", headers: { ...headers(env), Prefer: "return=representation" }, body: JSON.stringify({ personal_token_hash: token.hash, updated_at: new Date().toISOString() }), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient token rotation failed");
  return { token: token.raw };
}

export async function validateRecipientToken(slug: string, id: string, token: string) {
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(id)}&personal_token_hash=eq.${encodeURIComponent(hashCustomerToken(token))}&deleted_at=is.null&select=id&limit=1`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient validation failed");
  return (await response.json() as unknown[]).length === 1;
}

export async function validateRecipientSession(slug: string, id: string, token: string) {
  const hash = hashCustomerToken(token);
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&id=eq.${encodeURIComponent(id)}&personal_token_hash=eq.${encodeURIComponent(hash)}&deleted_at=is.null&select=id,wedding_slug,deleted_at&limit=1`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient validation failed");
  const [row] = await response.json() as Array<{ id: string; wedding_slug: string; deleted_at: string | null }>;
  return row && row.id === id && row.wedding_slug === slug && row.deleted_at === null;
}

export async function resolveRecipientToken(slug: string, token: string) {
  const hash = hashCustomerToken(token);
  const { env, url } = adminUrl(`/rest/v1/wedding_recipients?wedding_slug=eq.${encodeURIComponent(slug)}&personal_token_hash=eq.${encodeURIComponent(hash)}&deleted_at=is.null&select=id,wedding_slug,guest_name,deleted_at&limit=1`);
  const response = await fetch(url, { headers: headers(env), cache: "no-store" });
  if (!response.ok) throw new Error("Recipient validation failed");
  const [row] = await response.json() as Array<{ id: string; wedding_slug: string; guest_name: string; deleted_at: string | null }>;
  return row && row.wedding_slug === slug && row.deleted_at === null ? { id: row.id, name: row.guest_name } : null;
}
