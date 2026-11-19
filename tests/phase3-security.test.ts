import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  openRecipientSession,
  sealRecipientSession,
} from "../lib/customer-session";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

test("recipient sessions round-trip their tenant and recipient binding", () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "phase3-qa-only-secret";
  const issuedAt = Date.now();
  const value = sealRecipientSession("qa-wedding-a", "recipient-a", "opaque-token-a", issuedAt, issuedAt);
  const opened = openRecipientSession(value, issuedAt);
  assert.deepEqual(
    { slug: opened?.slug, recipientId: opened?.recipientId, token: opened?.token },
    { slug: "qa-wedding-a", recipientId: "recipient-a", token: "opaque-token-a" },
  );
  assert.equal(openRecipientSession(value, issuedAt + 7 * 24 * 60 * 60 * 1000 + 1), null);
});

test("customer and recipient exchanges use distinct limiter namespaces and no-store responses", () => {
  const customer = read("app", "api", "customer", "[slug]", "session", "route.ts");
  const recipient = read("app", "api", "wedding", "rsvp", "session", "route.ts");
  // Contract changed in Tahap 4: the persistent-first shared limiter
  // (allowSharedRequest, falling back to in-memory when Supabase is
  // unavailable) replaced the process-local allowRequest calls; the
  // distinct per-route scopes and limits are preserved.
  assert.match(customer, /allowSharedRequest\("customer-exchange", ip, 10, 60\)/);
  assert.match(recipient, /allowSharedRequest\("recipient-session", ip, 10, 60\)/);
  assert.doesNotMatch(customer, /allowRequest\(`customer-exchange/);
  assert.doesNotMatch(recipient, /allowRequest\(`recipient-session/);
  assert.match(customer, /Cache-Control.*no-store/);
  assert.match(recipient, /Cache-Control.*no-store/);
});

test("recipient session cookie is HttpOnly, scoped, and not persistent beyond the session contract", () => {
  const route = read("app", "api", "wedding", "rsvp", "session", "route.ts");
  assert.match(route, /RECIPIENT_SESSION_COOKIE/);
  assert.match(route, /httpOnly: true/);
  assert.match(route, /sameSite: "lax"/);
  assert.match(route, /path: "\/"/);
  // Contract changed in Tahap 4: the literal 7-day maxAge is now the shared
  // CUSTOMER_ABSOLUTE_TTL constant (same value, single source of truth).
  assert.match(route, /CUSTOMER_ABSOLUTE_TTL/);
  assert.match(route, /maxAge: CUSTOMER_ABSOLUTE_TTL/);
  assert.doesNotMatch(route, /maxAge: 7 \* 24 \* 60 \* 60/);
});

test("RSVP route binds the recipient by server-side name lookup, never by client recipient input", () => {
  const route = read("app", "api", "wedding", "rsvp", "route.ts");
  assert.match(route, /findRecipientByName\(slug, parsed\.data\.name\)/);
  assert.match(route, /recipientId: recipient\?\.id/);
  assert.doesNotMatch(route, /recipientId: parsed\.data\.recipientId/);
  assert.doesNotMatch(route, /session\.slug === slug/);
});
