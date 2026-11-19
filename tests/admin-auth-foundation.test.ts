import test from "node:test";
import assert from "node:assert/strict";
import type { AdminAuthFailure, AdminAuthPort, AdminAuthResult } from "../lib/admin-auth-contract";

test("typed auth result distinguishes normal failures", () => {
  const unauthenticated: AdminAuthResult = { ok: false, failure: { status: "unauthenticated" } };
  const unavailable: AdminAuthResult = { ok: false, failure: { status: "dependency_unavailable", cause: new Error("internal") } };
  assert.equal(unauthenticated.failure.status, "unauthenticated");
  assert.equal(unavailable.failure.status, "dependency_unavailable");
});

test("typed port preserves admin and recent policy names", () => {
  const policy: Parameters<AdminAuthPort["authenticate"]>[0] = "recent";
  const failure: AdminAuthFailure = { status: "reauthentication_required" };
  assert.equal(policy, "recent");
  assert.equal(failure.status, "reauthentication_required");
});
