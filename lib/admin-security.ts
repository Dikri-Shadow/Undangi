import "server-only";
import { createHash } from "node:crypto";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
export { isLocalDevelopmentRequest } from "@/lib/admin-development";

export type AdminClaims = { aal?: string; session_id?: string; sub?: string; iat?: number; exp?: number };
export function decodeClaims(token: string): AdminClaims | null { try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as AdminClaims; } catch { return null; } }
export const privacyHash = (value: string) => createHash("sha256").update(`${process.env.SUPABASE_SERVICE_ROLE_KEY || "local"}:${value}`).digest("hex");
export function requestIdentity(request: Request) { return { ipHash: privacyHash(request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"), userAgent: (request.headers.get("user-agent") || "unknown").slice(0, 300) }; }
export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}
export async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY; if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token }); if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
  if (!response.ok) return false; return Boolean((await response.json() as { success?: boolean }).success);
}
export async function recordSecurityEvent(request: Request, eventType: string, success: boolean, sessionId?: string, metadata: Record<string, string | boolean> = {}) {
  const identity = requestIdentity(request); await supabaseAdminAdapter.recordEvent({ event_type: eventType, success, session_id: sessionId || null, ip_hash: identity.ipHash, user_agent: identity.userAgent, metadata }).catch(() => undefined);
}
