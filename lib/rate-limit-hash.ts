import { createHash } from "node:crypto";

export function hashRateLimitKey(scope: string, identifier: string): string {
  return createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
}
