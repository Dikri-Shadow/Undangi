import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adminBootstrapSchema, adminLoginSchema, createBootstrapToken, hashBootstrapToken } from "../lib/admin-bootstrap";
import { adminRateLimitKey, isLocalDevelopmentRequest } from "../lib/admin-development";
import { checkPersistentAdminLoginLimit } from "../lib/admin-rate-limit";

test("persistent login rate limit distinguishes allowed, blocked, and unavailable RPC results", async () => {
  assert.equal(await checkPersistentAdminLoginLimit("hash", async () => true), "allowed");
  assert.equal(await checkPersistentAdminLoginLimit("hash", async () => false), "blocked");
  assert.equal(await checkPersistentAdminLoginLimit("hash", async () => { throw new Error("timeout"); }), "unavailable");
  assert.equal(await checkPersistentAdminLoginLimit("hash", async () => undefined), "unavailable");
});

test("login and bootstrap keep rate-limit failures fail-closed with distinct responses", () => {
  const login = readFileSync("app/api/admin/auth/login/route.ts", "utf8");
  const bootstrap = readFileSync("app/api/admin/auth/bootstrap/route.ts", "utf8");
  assert.match(login, /persistentLimit === "blocked"/);
  assert.match(login, /persistentLimit === "unavailable"/);
  assert.match(login, /status: 503/);
  assert.match(login, /status: 429/);
  assert.doesNotMatch(login, /admin_login_allowed[^\n]*\.catch\(\(\) => false\)/);
  // Contract changed in Tahap 4: bootstrap no longer uses the process-local
  // limiter (and its "in-memory-rejected" marker). It uses the shared
  // persistent-first limiter; the in-memory fallback (with its own warning)
  // now lives in lib/persistent-rate-limit.ts, and a blocked check still
  // returns 429.
  assert.match(bootstrap, /allowSharedRequest\("admin-bootstrap"/);
  assert.match(bootstrap, /status: 429/);
  assert.match(readFileSync("lib/persistent-rate-limit.ts", "utf8"), /persistent-unavailable-fallback-in-memory/);
  assert.match(readFileSync("services/adapters/supabase-admin-adapter.ts", "utf8"), /controller\.abort\(\), 5000/);
});

test("bootstrap requires a strong matching password and one-time token shape", () => {
  const valid = { email: "admin@example.com", password: "StrongPassword-123!", confirmPassword: "StrongPassword-123!", setupToken: createBootstrapToken(), turnstileToken: "verified-test-token" };
  assert.equal(adminBootstrapSchema.safeParse(valid).success, true);
  assert.equal(adminBootstrapSchema.safeParse({ ...valid, setupToken: "invalid" }).success, false);
  assert.equal(adminBootstrapSchema.safeParse({ ...valid, confirmPassword: "Different-123!" }).success, false);
  assert.equal(adminBootstrapSchema.safeParse({ ...valid, password: "weakpassword", confirmPassword: "weakpassword" }).success, false);
});

test("bootstrap tokens are random and stored as deterministic SHA-256 hashes", () => {
  const first = createBootstrapToken(); const second = createBootstrapToken();
  assert.notEqual(first, second);
  assert.equal(hashBootstrapToken(first).length, 64);
  assert.equal(hashBootstrapToken(first), hashBootstrapToken(first));
  assert.notEqual(hashBootstrapToken(first), first);
});

test("normal login validates credentials without a configured admin email", () => {
  assert.equal(adminLoginSchema.safeParse({ email: "admin@example.com", password: "password123", turnstileToken: "verified-test-token" }).success, true);
  assert.equal(adminLoginSchema.safeParse({ email: "invalid", password: "password123", turnstileToken: "verified-test-token" }).success, false);
  assert.equal(adminLoginSchema.safeParse({ email: "admin@example.com", password: "password123", turnstileToken: "" }).success, false);
});

test("local development bypasses only the Cloudflare challenge, not admin credentials", () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.NODE_ENV;
  try {
    env.NODE_ENV = "development";
    assert.equal(isLocalDevelopmentRequest(new Request("http://localhost:5173/api/admin/auth/login")), true);
    assert.equal(isLocalDevelopmentRequest(new Request("http://127.0.0.1:5173/api/admin/auth/login")), true);
    assert.equal(isLocalDevelopmentRequest(new Request("https://undangi.my.id/api/admin/auth/login")), false);
    assert.equal(adminLoginSchema.safeParse({ email: "admin@example.com", password: "password123", turnstileToken: "local-development" }).success, true);
  } finally {
    if (previous === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previous;
  }
});

test("production login and bootstrap verify Turnstile only when it is configured", () => {
  const login = readFileSync("app/api/admin/auth/login/route.ts", "utf8");
  const bootstrap = readFileSync("app/api/admin/auth/bootstrap/route.ts", "utf8");
  assert.match(login, /!localDevelopment && isTurnstileConfigured\(\) && !\(await verifyTurnstile/);
  assert.match(bootstrap, /!isLocalDevelopmentRequest\(request\) && isTurnstileConfigured\(\) && !\(await verifyTurnstile/);
  assert.match(readFileSync("lib/admin-security.ts", "utf8"), /export function isTurnstileConfigured/);
  assert.match(readFileSync("components/admin/login-form.tsx", "utf8"), /local-development/);
  assert.match(readFileSync("app/login/page.tsx", "utf8"), /process\.env\.NODE_ENV === "production"/);
  assert.match(readFileSync("app/login/page.tsx", "utf8"), /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
});

test("development login rate limits use an isolated namespace", () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.NODE_ENV;
  try {
    env.NODE_ENV = "development";
    const local = new Request("http://localhost:5173/api/admin/auth/login");
    const production = new Request("https://undangi.my.id/api/admin/auth/login");
    assert.equal(adminRateLimitKey(local, "admin-login", "local"), "admin-login:development:local");
    assert.equal(adminRateLimitKey(production, "admin-login", "local"), "admin-login:local");
    assert.notEqual(adminRateLimitKey(local, "admin-login", "local"), adminRateLimitKey(production, "admin-login", "local"));
  } finally {
    if (previous === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previous;
  }
});

test("local QA login bypasses cooldown only behind the local QA server flag", () => {
  const login = readFileSync("app/api/admin/auth/login/route.ts", "utf8");
  assert.match(login, /process\.env\.UNDANGI_LOCAL_QA === "1"/);
  assert.match(login, /if \(!localQa\)/);
  assert.match(login, /if \(!localQa\) await supabaseAdminAdapter\.adminRpc\("consume_admin_login_failure"/);
});

test("login keeps production bucket identity unchanged", () => {
  const login = readFileSync("app/api/admin/auth/login/route.ts", "utf8");
  const bootstrap = readFileSync("app/api/admin/auth/bootstrap/route.ts", "utf8");
  assert.match(login, /privacyHash\(localDevelopment \? `development:\$\{ip\}` : ip\)/);
  assert.match(login, /adminRateLimitKey\(request, "admin-login", ip\)/);
  assert.match(bootstrap, /adminRateLimitKey\(request, "admin-bootstrap", ip\)/);
  assert.doesNotMatch(login, /admin-login:development/);
  assert.doesNotMatch(bootstrap, /admin-bootstrap:development/);
});

test("hardening migration keeps auth state server-only and rate limits across instances", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609240004_admin_auth_hardening.sql", import.meta.url), "utf8");
  assert.match(sql, /admin_auth_sessions/); assert.match(sql, /admin_recent_reauth/); assert.match(sql, /admin_security_events/);
  assert.match(sql, /admin_login_limits/); assert.match(sql, /consume_admin_login_failure/);
  assert.match(sql, /revoke all on public\.admin_auth_sessions/);
});

test("login creates a server session and enters the CMS directly", () => {
  const route = readFileSync("app/api/admin/auth/login/route.ts", "utf8");
  assert.match(route, /registerSession\(claims\.session_id, session\.user\.id\)/);
  assert.match(route, /next: "\/admin"/);
  assert.doesNotMatch(route, /mfa|totp|aal2/i);
});

test("admin authorization enforces singleton session, idle/max lifetime, and recent reauth", () => {
  const source = readFileSync(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
  assert.match(source, /isAdminUser\(claims\.sub\)/); assert.match(source, /user\.id !== claims\.sub/); assert.match(source, /30 \* 60_000/); assert.match(source, /8 \* 60 \* 60_000/); assert.match(source, /hasRecentReauth/);
  assert.match(source, /Promise\.all/); assert.match(source, /last_seen_at\) > 60_000/);
  assert.doesNotMatch(source, /aal2/i);
});

test("Phase 3.4 classifies missing and invalid sessions as unauthenticated", () => {
  const source = readFileSync(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
  assert.match(source, /if \(!env\) throw new AdminAuthError/);
  // authenticateAdmin reports failures as typed results: missing/invalid
  // sessions are "unauthenticated" (401 at the boundary), while a
  // non-admin principal is "forbidden" (403). Dependency failures are
  // "dependency_unavailable" (503 at the boundary).
  assert.match(source, /if \(!token\) return \{ ok: false, failure: \{ status: "unauthenticated" \} \}/);
  assert.match(source, /if \(!claims\?\.sub \|\| !claims\.session_id\) return \{ ok: false, failure: \{ status: "unauthenticated" \} \}/);
  assert.match(source, /if \(!response\.ok\)/);
  assert.match(source, /if \(!isAdmin\) return \{ ok: false, failure: \{ status: "forbidden" \} \}/);
  assert.match(source, /if \(!user\.id \|\| user\.id !== claims\.sub \|\| !user\.email\) return \{ ok: false, failure: \{ status: "unauthenticated" \} \}/);
  assert.match(source, /catch \(error\) \{[\s\S]*?status: "dependency_unavailable"/);
  assert.match(source, /if \(!session \|\| session\.revoked_at/);
  assert.match(source, /export async function requireAdminApi\(\) \{[\s\S]*?if \(result\.failure\.status === "dependency_unavailable"\) throw new AdminAuthError/);
  assert.match(source, /export async function requireAdminApi\(\) \{[\s\S]*?return null;/);
});

test("Phase 3.4 dependency failures remain classified as service unavailable", () => {
  const auth = readFileSync(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
  const routes = [
    "app/api/admin/auth/login/route.ts",
    "app/api/admin/wishes/pending/route.ts",
    "app/api/admin/media/route.ts",
  ].map((file) => readFileSync(file, "utf8"));
  assert.match(auth, /isAdminAuthDependencyFailure/);
  assert.ok(routes.some((source) => /catch \{ return NextResponse\.json\(\{ error: [^}]+ \}, \{ status: 503/.test(source)));
  assert.match(routes[0], /catch \{ return NextResponse\.json\(\{ error: "Layanan login tidak tersedia\." \}, \{ status: 503/);
});

test("Phase 3.4 admin routes preserve 401 unauthenticated and 503 dependency contracts", () => {
  const routeSources = [
    "app/api/admin/weddings/route.ts",
    "app/api/admin/wishes/pending/route.ts",
    "app/api/admin/media/route.ts",
  ].map((file) => readFileSync(file, "utf8"));
  for (const source of routeSources) {
    assert.match(source, /requireAdminApi\(\)/);
    assert.match(source, /status: 401/);
  }
  assert.match(routeSources[0], /catch \{ return NextResponse\.json\(\{ error: "Data undangan belum dapat dimuat\." \}, \{ status: 503/);
  assert.match(routeSources[1], /status: 503/);
  assert.match(routeSources[2], /status: 503/);
});

test("Phase 3.4 auth failures do not leak dependency or credential details", () => {
  const files = [
    "lib/admin-auth.ts",
    "app/api/admin/auth/login/route.ts",
    "app/api/admin/wishes/pending/route.ts",
    "app/api/admin/media/route.ts",
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /error\.message|JSON\.stringify\(error\)/);
  }
});

test("sensitive reauth verifies the current admin password and never stores it", () => {
  const route = readFileSync("app/api/admin/auth/reauth/route.ts", "utf8");
  assert.match(route, /signIn\(user\.email, body\.password\)/);
  assert.match(route, /temporarySession\?\.user\?\.id === user\.id/);
  assert.match(route, /revoke\(temporarySession\.access_token\)/);
  assert.match(route, /markRecentReauth\(user\.sessionId\)/);
  assert.match(route, /password_reauth_success/);
  assert.match(route, /password_reauth_failed/);
  assert.doesNotMatch(route, /recordSecurityEvent\([^\n]*body\.password/);
});

test("MFA endpoints are removed and legacy pages only redirect safely", () => {
  const loginLegacy = readFileSync("app/login/mfa/page.tsx", "utf8");
  const setupLegacy = readFileSync("app/admin/security/setup-mfa/page.tsx", "utf8");
  assert.match(loginLegacy, /redirect\(\(await getAdminUser\(\)\) \? "\/admin" : "\/login"\)/);
  assert.match(setupLegacy, /redirect\("\/admin"\)/);
});

test("migration enforces one admin, private bootstrap storage, expiry, and atomic claim", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609240003_single_admin_bootstrap.sql", import.meta.url), "utf8");
  assert.match(sql, /singleton_key smallint not null default 1 unique check \(singleton_key = 1\)/);
  assert.match(sql, /token_hash text not null unique/);
  assert.match(sql, /used_at is null/);
  assert.match(sql, /expires_at > now\(\)/);
  assert.match(sql, /security definer/);
  assert.match(sql, /revoke all on public\.app_admin from anon, authenticated/);
  assert.match(sql, /revoke all on public\.admin_bootstrap_tokens from anon, authenticated/);
  assert.match(sql, /when unique_violation then/);
});
