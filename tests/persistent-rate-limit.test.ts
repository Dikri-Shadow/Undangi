import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { hashRateLimitKey } from "../lib/rate-limit-hash";
import { allowSharedRequest } from "../lib/persistent-rate-limit";

test("persistent rate-limit keys are deterministic SHA-256 hashes", () => {
  const first = hashRateLimitKey("rsvp", "127.0.0.1");
  assert.equal(first, hashRateLimitKey("rsvp", "127.0.0.1"));
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, hashRateLimitKey("rsvp", "127.0.0.2"));
});

test("shared rate-limit migration is service-role-only and atomic", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202611130001_shared_rate_limits.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists public\.shared_rate_limits/);
  assert.match(sql, /on conflict \(key_hash\) do update/);
  assert.match(sql, /revoke all on function public\.consume_shared_rate_limit/);
  assert.match(sql, /grant execute on function public\.consume_shared_rate_limit.*service_role/);
});

test("shared limiter falls back to in-memory when the persistent store is unavailable", async () => {
  // Force the "unavailable" path regardless of ambient env: without a
  // Supabase admin env the persistent check cannot run.
  const saved = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
    .map((key) => [key, process.env[key]] as const);
  for (const [key] of saved) delete process.env[key];
  try {
    const identifier = `fallback-qa-${Date.now()}-${Math.random()}`;
    assert.equal(await allowSharedRequest("persistent-rate-limit-fallback-qa", identifier, 2, 60), "allowed");
    assert.equal(await allowSharedRequest("persistent-rate-limit-fallback-qa", identifier, 2, 60), "allowed");
    assert.equal(await allowSharedRequest("persistent-rate-limit-fallback-qa", identifier, 2, 60), "blocked");
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
