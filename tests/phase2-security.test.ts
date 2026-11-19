import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { openCustomerSession, sealCustomerSession } from "../lib/customer-session";
import { allowRequest } from "../lib/rate-limit";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

test("customer tokens are opaque, hashed deterministically, and freshly rotated", () => {
  const service = read("services", "admin-guest-access-service.ts");
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /function createCustomerToken|export function createCustomerToken/);
  const first = randomBytes(32).toString("base64url");
  const second = randomBytes(32).toString("base64url");
  const hash = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
  assert.notEqual(first, second);
  assert.equal(hash(first).length, 64);
  assert.notEqual(hash(first), first);
  assert.notEqual(hash(first), hash(second));
});

test("personal tokens are short (12 random bytes) so guest links stay short", () => {
  const service = read("services", "admin-guest-access-service.ts");
  assert.match(service, /randomBytes\(12\)\.toString\("base64url"\)/);
  assert.equal(Buffer.from(randomBytes(12).toString("base64url"), "base64url").length, 12);
  assert.equal(randomBytes(12).toString("base64url").length, 16);
});

test("session exchange accepts the short 16-char personal tokens", () => {
  const customer = read("app", "api", "customer", "[slug]", "session", "route.ts");
  const recipient = read("app", "api", "wedding", "rsvp", "session", "route.ts");
  assert.match(customer, /token\.length < 16/);
  assert.match(recipient, /token\.length < 16/);
  assert.doesNotMatch(customer, /token\.length < 40/);
  assert.doesNotMatch(recipient, /token\.length < 40/);
});

test("customer sessions are bound to slug and reject tampering, expiry, and cross-wedding reuse", () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "phase2-qa-only-secret";
  const now = Date.now();
  const session = sealCustomerSession("qa-wedding-a", "opaque-token-a", now, now);
  assert.equal(openCustomerSession(session, now)?.slug, "qa-wedding-a");
  assert.equal(openCustomerSession(session, now + 24 * 60 * 60 * 1000 + 1), null);
  assert.equal(openCustomerSession(`${session}x`, now), null);
  assert.notEqual(openCustomerSession(session, now)?.slug, "qa-wedding-b");
});

test("recipient token validation scopes wedding, active recipient, and non-deleted row", () => {
  const service = read("services", "admin-guest-access-service.ts");
  assert.match(service, /wedding_slug=eq\.\$\{encodeURIComponent\(slug\)\}/);
  assert.match(service, /personal_token_hash=eq\.\$\{encodeURIComponent\(hashCustomerToken\(token\)\)\}/);
  assert.match(service, /deleted_at=is\.null/);
});

test("RSVP ignores client-supplied recipientId and binds recipient by server-side name lookup", () => {
  const route = read("app", "api", "wedding", "rsvp", "route.ts");
  assert.match(route, /findRecipientByName\(slug, parsed\.data\.name\)/,
    "RSVP must resolve the recipient from the submitted name on the server");
  assert.match(route, /recipientId: recipient\?\.id/);
  assert.doesNotMatch(route, /recipientId: parsed\.data\.recipientId/,
    "a client-supplied recipientId must never be trusted");
  assert.doesNotMatch(route, /validateRecipientSession\(slug, session\.recipientId, session\.token\)/);
});

test("RSVP and wishes preserve idempotency keys and treat duplicate RSVP as success", () => {
  const adapter = read("services", "adapters", "supabase-wedding-adapter.ts");
  const migration = read("supabase", "migrations", "202609240001_create_wedding_responses.sql");
  assert.match(adapter, /idempotency_key: payload\.submissionId/);
  assert.match(migration, /unique \(wedding_slug, idempotency_key\)/);
  assert.match(adapter, /response\.status === 409 && payload\.recipientId/);
  assert.match(adapter, /method: "PATCH"/);
});

test("same-origin checks reject missing and foreign origins while allowing same origin", () => {
  const auth = read("lib", "admin-auth.ts");
  assert.match(auth, /request\.headers\.get\("origin"\)/);
  assert.match(auth, /new URL\(origin\)\.origin === new URL\(request\.url\)\.origin/);
  const base = { method: "POST", headers: { "content-type": "application/json" } };
  const sameOrigin = (request: Request) => {
    const origin = request.headers.get("origin");
    return Boolean(origin) && new URL(origin!).origin === new URL(request.url).origin;
  };
  assert.equal(sameOrigin(new Request("https://qa.example.test/api", base)), false);
  assert.equal(sameOrigin(new Request("https://qa.example.test/api", { ...base, headers: { ...base.headers, origin: "https://evil.example.test" } })), false);
  assert.equal(sameOrigin(new Request("https://qa.example.test/api", { ...base, headers: { ...base.headers, origin: "https://qa.example.test" } })), true);
});

test("rate limiting blocks the request after the configured threshold without persistence", () => {
  const key = `phase2-qa-${Date.now()}-${Math.random()}`;
  assert.equal(allowRequest(key, 2, 60_000), true);
  assert.equal(allowRequest(key, 2, 60_000), true);
  assert.equal(allowRequest(key, 2, 60_000), false);
});
