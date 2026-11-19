import { hashRateLimitKey } from "@/lib/rate-limit-hash";
import { allowRequest } from "@/lib/rate-limit";

export type PersistentRateLimitResult = "allowed" | "blocked" | "unavailable";

/**
 * Persistent check via the shared Supabase rate-limit table.
 * The adapter is imported lazily so this module stays importable from plain
 * node:test processes (the adapter pulls in "server-only", which only
 * resolves inside Next.js). A failed import is treated like any other
 * infrastructure failure: "unavailable".
 */
export async function allowPersistentRequest(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<PersistentRateLimitResult> {
  try {
    const { supabaseAdminAdapter } = await import("@/services/adapters/supabase-admin-adapter");
    const allowed = await supabaseAdminAdapter.consumeSharedRateLimit(
      hashRateLimitKey(scope, identifier), limit, windowSeconds,
    );
    return allowed ? "allowed" : "blocked";
  } catch (error) {
    console.warn("[rate-limit] persistent-check-unavailable", {
      code: error instanceof Error ? error.message.slice(0, 80) : "unknown",
    });
    return "unavailable";
  }
}

/**
 * Shared limiter: persistent first, in-memory fallback when the persistent
 * store is unavailable (Supabase not configured / local mock mode / table
 * not deployed yet). The fallback uses the same scope, identifier, limit,
 * and window so behaviour stays consistent across instances only when the
 * persistent store is up; otherwise each instance enforces its own bucket.
 */
export async function allowSharedRequest(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<"allowed" | "blocked"> {
  const result = await allowPersistentRequest(scope, identifier, limit, windowSeconds);
  if (result !== "unavailable") return result;
  console.warn("[rate-limit] persistent-unavailable-fallback-in-memory", { scope });
  return allowRequest(`${scope}:${identifier}`, limit, windowSeconds * 1000) ? "allowed" : "blocked";
}
