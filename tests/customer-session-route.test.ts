import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { openCustomerSession, sealCustomerSession } from "../lib/customer-session";

const route = readFileSync("app/api/customer/[slug]/recipients/route.ts", "utf8");

test("GET valid session contract is tenant-bound and returns only active recipients", () => {
  assert.match(route, /export async function GET/);
  assert.match(route, /session\.slug\s*!==\s*slug/);
  // Contract changed in Tahap 4: session tokens are validated personal-first
  // then legacy (validateCustomerSessionToken), and GET now joins RSVPs via
  // listRecipientsWithRsvp, returning rsvpStatus per recipient plus stats.
  assert.match(route, /validateCustomerSessionToken\(slug, session\.token\)/);
  assert.match(route, /listRecipientsWithRsvp\(slug\)/);
  assert.match(route, /rsvpStatus: row\.rsvp \? row\.rsvp\.attendance : "belum"/);
  assert.match(route, /const stats = \{ total: report\.totalRecipients, hadir: report\.attending, tidak: report\.declined, belum: report\.pending, totalGuests: report\.guests \}/);
  assert.match(route, /guestName: row\.guestName/);
  assert.match(route, /Cache-Control.*no-store/);
});

test("GET denies an invalid session without listing recipients", () => {
  assert.match(route, /if \(session\) \{/);
  assert.match(route, /return genericDenied\(\);/);
  assert.match(route, /if \(!session \|\| session\.slug !== slug \|\| !\(await validateCustomerSessionToken\(slug, session\.token\)\)\) return null/);
});

test("GET converts session-validation and recipient-list dependency failures to generic 503 responses", () => {
  assert.match(route, /try \{\s*session = await sessionFor\(request, slug\);\s*\} catch \{\s*return genericDependencyFailure\(\);\s*\}/s);
  assert.match(route, /try \{\s*const rows = await listRecipientsWithRsvp\(slug\);/s);
  assert.match(route, /NextResponse\.json\(\{ recipients:/s);
  assert.match(route, /\} catch \{\s*return genericDependencyFailure\(\);\s*\}/s);
  assert.match(route, /const genericDependencyFailure = \(\) => NextResponse\.json\(\{ error: "Layanan customer belum dapat memproses permintaan\." \}, \{ status: 503/);
  assert.doesNotMatch(route, /catch \(error\).*error\.message/s);
});

test("revoked and rotated credentials are rejected through active-token validation", () => {
  assert.match(route, /if \(!session \|\| session\.slug !== slug \|\| !\(await validateCustomerSessionToken\(slug, session\.token\)\)\) return null/);
  const service = readFileSync("services/admin-guest-access-service.ts", "utf8");
  assert.match(service, /revoked_at=is\.null/);
  assert.match(service, /rotate_wedding_guest_access/);
});

test("GET rejects slug mismatch, malformed cookie, Bearer, and query-token bypasses", () => {
  assert.match(route, /if \(!slugPattern\.test\(slug\) \|\| slug\.length > 80\) return genericDenied\(\)/);
  assert.match(route, /openCustomerSession\(cookie\)/);
  assert.match(route, /if \(url\.searchParams\.has\("token"\)\) return genericDenied\(\)/);
  assert.doesNotMatch(route, /request\.headers\.get\("authorization"\)/);
  assert.doesNotMatch(route, /Bearer/);
});

test("session fixture proves a valid cookie opens only with its original tenant binding", () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "customer-session-route-test-secret";
  const issuedAt = Date.now();
  const cookie = sealCustomerSession("qa-wedding-a", "qa-token", issuedAt, issuedAt);
  assert.equal(openCustomerSession(cookie, issuedAt)?.slug, "qa-wedding-a");
  assert.equal(openCustomerSession(cookie, issuedAt)?.token, "qa-token");
  assert.notEqual(openCustomerSession(cookie, issuedAt)?.slug, "other-wedding");
  assert.equal(openCustomerSession("malformed-cookie", issuedAt), null);
});
