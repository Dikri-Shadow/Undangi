import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { buildRecipientReportCsv, calculateRsvpStats } from "../lib/rsvp-report";
import {
  CUSTOMER_ABSOLUTE_TTL,
  getCustomerSessionDeviceLimit,
  hashDeviceFingerprint,
  isLegacyCustomerTokenEnabled,
  selectCustomerSessionsToEvict,
} from "../lib/customer-session";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

test("customer GET returns rsvpStatus per recipient plus stats", () => {
  const route = read("app", "api", "customer", "[slug]", "recipients", "route.ts");
  assert.match(route, /listRecipientsWithRsvp\(slug\)/);
  assert.match(route, /rsvpStatus: row\.rsvp \? row\.rsvp\.attendance : "belum"/);
  assert.match(route, /guestCount: row\.rsvp \? row\.rsvp\.guestCount : 0/);
  assert.match(route, /totalGuests: report\.guests/);
  // The stats mapping itself, exercised through the shared report helper.
  const rows = [
    { id: "a", guestName: "A", rsvp: { guestName: "A", attendance: "hadir" as const, guestCount: 3, message: "OK", createdAt: "2026-11-18" } },
    { id: "b", guestName: "B", rsvp: { guestName: "B", attendance: "tidak" as const, guestCount: 1, message: null, createdAt: "2026-11-18" } },
    { id: "c", guestName: "C", rsvp: null },
  ];
  const report = calculateRsvpStats([], rows);
  assert.deepEqual(
    { total: report.totalRecipients, hadir: report.attending, tidak: report.declined, belum: report.pending, totalGuests: report.guests },
    { total: 3, hadir: 1, tidak: 1, belum: 1, totalGuests: 3 },
  );
});

test("customer CSV export lists every recipient including Belum mengisi", () => {
  const rows = [
    { id: "a", guestName: "A", rsvp: { guestName: "A", attendance: "hadir" as const, guestCount: 2, message: "Hadir ya", createdAt: "2026-11-18" } },
    { id: "b", guestName: "B", rsvp: null },
  ];
  const csv = buildRecipientReportCsv(rows);
  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /Nama tamu/);
  assert.match(csv, /Status RSVP/);
  assert.match(csv, /"Belum mengisi"/);
  assert.match(csv, /"Hadir"/);
  const route = read("app", "api", "customer", "[slug]", "recipients", "export", "route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /validateCustomerSessionToken\(slug, session\.token\)/);
  assert.match(route, /buildRecipientReportCsv\(reportRows\)/);
  assert.match(route, /buildWhatsAppReport\(slug, stats\)/);
  assert.match(route, /attachment; filename="rsvp-\$\{slug\}\.csv"/);
  assert.match(route, /text\/csv; charset=utf-8/);
  assert.match(route, /Cache-Control.*no-store/);
});

test("RSVP uses the client-supplied name from ?to= and links it to a recipient by name", () => {
  const route = read("app", "api", "wedding", "rsvp", "route.ts");
  assert.match(route, /findRecipientByName\(slug, parsed\.data\.name\)/);
  assert.match(route, /name: parsed\.data\.name/);
  assert.match(route, /recipientId: recipient\?\.id/);
  assert.doesNotMatch(route, /getVerifiedRecipient\(slug, session\.recipientId, session\.token\)/);
  assert.doesNotMatch(route, /RECIPIENT_SESSION_COOKIE/);
  const service = read("services", "admin-guest-access-service.ts");
  assert.match(service, /export async function findRecipientByName/);
  assert.match(service, /listActiveRecipients\(slug\)/);
});

test("personal owner token is validated first and legacy is killed by env flag", () => {
  const service = read("services", "admin-guest-access-service.ts");
  assert.match(service, /export async function validateCustomerAccess\(slug: string, token: string\)/);
  assert.match(service, /wedding_customer_access\?wedding_slug=eq\./);
  assert.match(service, /revoked_at=is\.null/);
  assert.match(service, /export async function validateCustomerSessionToken/);
  assert.match(service, /if \(!isLegacyCustomerTokenEnabled\(\)\) return false/);
  assert.match(service, /legacy-customer-token-deprecated/);
  const session = read("app", "api", "customer", "[slug]", "session", "route.ts");
  assert.match(session, /validateCustomerSessionToken\(slug, token\)/);
  const admin = read("app", "api", "admin", "weddings", "[id]", "customer-access", "route.ts");
  assert.match(admin, /requireAdminApi\(\)/);
  assert.match(admin, /isSameOrigin\(request\)/);
  assert.match(admin, /createCustomerAccess\(row\.slug/);
  assert.match(admin, /listCustomerAccess\(row\.slug\)/);
  assert.match(admin, /revokeCustomerAccess\(row\.slug/);
  const migration = read("supabase", "migrations", "202611180001_customer_personal_access.sql");
  assert.match(migration, /create table if not exists public\.wedding_customer_access/);
  assert.match(migration, /token_hash text unique not null/);
  assert.match(migration, /revoke all on public\.wedding_customer_access from anon, authenticated/);
  // Behavioural: the kill-switch itself is a pure env gate (no DB needed).
  const saved = process.env.LEGACY_CUSTOMER_TOKEN_ENABLED;
  try {
    delete process.env.LEGACY_CUSTOMER_TOKEN_ENABLED;
    assert.equal(isLegacyCustomerTokenEnabled(), true);
    process.env.LEGACY_CUSTOMER_TOKEN_ENABLED = "false";
    assert.equal(isLegacyCustomerTokenEnabled(), false);
    process.env.LEGACY_CUSTOMER_TOKEN_ENABLED = "true";
    assert.equal(isLegacyCustomerTokenEnabled(), true);
  } finally {
    if (saved === undefined) delete process.env.LEGACY_CUSTOMER_TOKEN_ENABLED;
    else process.env.LEGACY_CUSTOMER_TOKEN_ENABLED = saved;
  }
});

test("legacy guest-access admin routes are marked deprecated but kept", () => {
  const route = read("app", "api", "admin", "weddings", "[id]", "guest-access", "route.ts");
  const regenerate = read("app", "api", "admin", "weddings", "[id]", "guest-access", "regenerate", "route.ts");
  assert.match(route, /@deprecated/);
  assert.match(regenerate, /@deprecated/);
  assert.match(route, /rotateGuestAccess/);
  assert.match(regenerate, /rotateGuestAccess/);
});

test("device limit evicts the oldest session first (unit, no live DB)", () => {
  const sessions = [
    { id: "oldest", last_seen_at: "2026-11-18T00:00:00Z" },
    { id: "middle", last_seen_at: "2026-11-18T01:00:00Z" },
    { id: "newest", last_seen_at: "2026-11-18T02:00:00Z" },
  ];
  assert.deepEqual(selectCustomerSessionsToEvict(sessions, 3), ["oldest"]);
  assert.deepEqual(selectCustomerSessionsToEvict(sessions, 2), ["oldest", "middle"]);
  assert.deepEqual(selectCustomerSessionsToEvict(sessions.slice(0, 2), 3), []);
  assert.deepEqual(selectCustomerSessionsToEvict([], 3), []);
  assert.equal(getCustomerSessionDeviceLimit(), 3);
  process.env.CUSTOMER_SESSION_DEVICE_LIMIT = "5";
  assert.equal(getCustomerSessionDeviceLimit(), 5);
  process.env.CUSTOMER_SESSION_DEVICE_LIMIT = "not-a-number";
  assert.equal(getCustomerSessionDeviceLimit(), 3);
  delete process.env.CUSTOMER_SESSION_DEVICE_LIMIT;
  const fingerprint = hashDeviceFingerprint("Mozilla/5.0 qa-agent");
  assert.equal(fingerprint, hashDeviceFingerprint("Mozilla/5.0 qa-agent"));
  assert.match(fingerprint, /^[0-9a-f]{64}$/);
  assert.notEqual(fingerprint, hashDeviceFingerprint("Another-Agent/1.0"));
  // Wiring: the adapter enforces + registers fail-open, and both exchange
  // routes run enforcement before the cookie is set.
  const adapter = read("services", "adapters", "supabase-admin-adapter.ts");
  assert.match(adapter, /async enforceCustomerSessionLimit/);
  assert.match(adapter, /async registerCustomerSession/);
  assert.match(adapter, /selectCustomerSessionsToEvict\(rows, limit\)/);
  assert.match(adapter, /revoked_at: new Date\(\)\.toISOString\(\)/);
  assert.match(adapter, /limit-enforcement-unavailable/);
  assert.match(adapter, /register-unavailable/);
  const migration = read("supabase", "migrations", "202611180002_customer_sessions.sql");
  assert.match(migration, /create table if not exists public\.customer_sessions/);
  assert.match(migration, /subject_type text not null check \(subject_type in \('customer', 'recipient'\)\)/);
  assert.match(migration, /revoke all on public\.customer_sessions from anon, authenticated/);
  for (const route of [
    read("app", "api", "customer", "[slug]", "session", "route.ts"),
    read("app", "api", "wedding", "rsvp", "session", "route.ts"),
  ]) {
    assert.match(route, /enforceCustomerSessionLimit\(/);
    assert.match(route, /registerCustomerSession\(/);
    assert.match(route, /hashDeviceFingerprint\(request\.headers\.get\("user-agent"\)\)/);
    assert.ok(route.indexOf("enforceCustomerSessionLimit") < route.indexOf("cookies.set"), "enforcement must run before the cookie is set");
  }
});

test("shared rate limit uses distinct scopes per route; admin login is untouched", () => {
  const cases: Array<[string[], string]> = [
    [["app", "api", "wedding", "rsvp", "route.ts"], "rsvp"],
    [["app", "api", "wedding", "rsvp", "session", "route.ts"], "recipient-session"],
    [["app", "api", "wedding", "wishes", "route.ts"], "wish"],
    [["app", "api", "customer", "[slug]", "session", "route.ts"], "customer-exchange"],
    [["app", "api", "customer", "[slug]", "recipients", "route.ts"], "customer-mutation"],
    [["app", "api", "admin", "auth", "bootstrap", "route.ts"], "admin-bootstrap"],
    [["app", "api", "admin", "security", "password", "route.ts"], "admin-password"],
  ];
  for (const [parts, scope] of cases) {
    const source = read(...parts);
    assert.match(source, new RegExp(`allowSharedRequest\\("${scope}"`), `${parts.join("/")} must use the ${scope} scope`);
    assert.doesNotMatch(source, /from "@\/lib\/rate-limit"/);
  }
  const login = read("app", "api", "admin", "auth", "login", "route.ts");
  assert.doesNotMatch(login, /allowSharedRequest/);
  assert.match(login, /checkPersistentAdminLoginLimit/);
});

test("customer session policy documents the final TTL, cookie, and device-limit decisions", () => {
  const policy = read("docs", "customer-session-policy.md");
  assert.match(policy, /7 hari/);
  assert.match(policy, /24 jam/);
  assert.match(policy, /Maks 3 sesi aktif/);
  assert.match(policy, /CUSTOMER_SESSION_DEVICE_LIMIT/);
  assert.match(policy, /LEGACY_CUSTOMER_TOKEN_ENABLED=false/);
  assert.match(policy, /202611180001/);
  assert.match(policy, /202611180002/);
  assert.equal(CUSTOMER_ABSOLUTE_TTL, 7 * 24 * 60 * 60);
});

test("recipient session exchange builds a fresh Request from the URL, never from the consumed request", () => {
  const route = read("app", "api", "wedding", "[slug]", "recipient", "session", "exchange", "route.ts");
  assert.doesNotMatch(route, /new Request\(request,/);
  assert.match(route, /new Request\(request\.url,/);
  assert.match(route, /headers\.delete\("content-length"\)/);
  assert.match(route, /JSON\.stringify\(\{ \.\.\.body, slug \}\)/);
});
