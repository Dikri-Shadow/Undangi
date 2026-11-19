export type PersistentRateLimitResult = "allowed" | "blocked" | "unavailable";

type RateLimitCheck = (keyHash: string) => Promise<unknown>;

/** Keeps an RPC failure fail-closed without misreporting it as a client rate limit. */
export async function checkPersistentAdminLoginLimit(
  keyHash: string,
  check: RateLimitCheck,
): Promise<PersistentRateLimitResult> {
  try {
    const result = await check(keyHash);
    if (result === true) return "allowed";
    if (result === false) return "blocked";
    return "unavailable";
  } catch (error) {
    console.warn("[admin-rate-limit] persistent-check-unavailable", {
      code: error instanceof Error ? error.message.slice(0, 80) : "unknown",
    });
    return "unavailable";
  }
}
