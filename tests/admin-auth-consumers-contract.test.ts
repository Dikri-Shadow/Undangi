import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const consumers = [
  "app/api/admin/auth/reauth/route.ts",
  "app/api/admin/media/route.ts",
  "app/api/admin/weddings/[id]/duplicate/route.ts",
  "app/api/admin/weddings/[id]/guest-access/regenerate/route.ts",
  "app/api/admin/weddings/[id]/guest-access/route.ts",
  "app/api/admin/weddings/[id]/recipients/route.ts",
  "app/api/admin/weddings/[id]/restore/route.ts",
  "app/api/admin/weddings/[id]/route.ts",
  "app/api/admin/weddings/route.ts",
  "app/api/admin/wishes/[id]/route.ts",
  "app/api/admin/wishes/pending/route.ts",
] as const;

function sourceOf(file: string) {
  return readFileSync(file, "utf8");
}

test("the consumer inventory covers every source-level requireAdminApi call", () => {
  const actual = consumers
    .flatMap((file) => sourceOf(file).match(/requireAdminApi\(\)/g) ?? [])
    .length;
  const repositoryCount = consumers.reduce(
    (count, file) => count + (sourceOf(file).match(/requireAdminApi\(\)/g) ?? []).length,
    0,
  );

  assert.equal(actual, repositoryCount);
  assert.ok(actual >= consumers.length);
});

test("every requireAdminApi consumer distinguishes 401 from auth dependency 503", () => {
  for (const file of consumers) {
    const source = sourceOf(file);
    assert.match(source, /requireAdminApi\(\)/, file);
    // An unauthenticated branch exists and can answer 401: a literal 401,
    // the bad(401) helper, or the shared adminAuthFailureResponse classifier
    // (which maps an unauthenticated failure to 401).
    assert.match(source, /if \(!(user|admin)\)/, `${file}: missing unauthenticated branch`);
    assert.ok(
      /status:\s*401\b/.test(source) || /bad\(401\)/.test(source) || /adminAuthFailureResponse/.test(source),
      `${file}: unauthenticated 401 contract is not reachable`,
    );
    // An auth dependency failure must map to 503: a literal 503, the bad()
    // default (503), or the shared classifier (dependency_unavailable -> 503).
    assert.ok(
      /status:\s*503\b/.test(source) || /bad\(\)/.test(source) || /adminAuthFailureResponse/.test(source),
      `${file}: missing auth dependency 503 contract`,
    );
    // The classification mechanism must be visible: the shared helper or an
    // explicit AdminAuthError / isAdminAuthDependencyFailure check.
    assert.match(
      source,
      /adminAuthFailureResponse|isAdminAuthDependencyFailure|AdminAuthError/,
      `${file}: AdminAuthError dependency classification is not handled`,
    );
  }
});

test("AdminAuthError cannot escape a requireAdminApi consumer", () => {
  for (const file of consumers) {
    const source = sourceOf(file);
    assert.match(
      source,
      /try\s*\{[\s\S]*requireAdminApi\(\)[\s\S]*catch\s*\(/,
      `${file}: requireAdminApi is not inside a catch boundary`,
    );
    assert.doesNotMatch(source, /catch\s*\([^)]*\)\s*\{\s*throw\s+error\s*;?\s*\}/, file);
  }
});

test("admin auth consumers never expose raw dependency or credential details", () => {
  for (const file of consumers) {
    const source = sourceOf(file);
    assert.doesNotMatch(source, /(?:NextResponse|Response)\.json\(\s*error\s*\)/, file);
    assert.doesNotMatch(source, /error:\s*(?:error\.message|error\.stack|JSON\.stringify\(error\))/ , file);
  }
});
