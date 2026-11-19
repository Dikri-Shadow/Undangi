import "server-only";
import { getSupabaseAdminEnv, getSupabasePublicEnv } from "@/lib/supabase-env";
import type { AdminAuthFailure } from "@/lib/admin-auth-contract";
import { selectCustomerSessionsToEvict } from "@/lib/customer-session";

type AdminRow = { id: string; auth_user_id: string; email: string };
type AuthSession = { access_token: string; refresh_token: string; expires_in?: number; user?: { id?: string; email?: string } };

async function adminRequest(path: string, init: RequestInit = {}) {
  const env = getSupabaseAdminEnv();
  if (!env) throw new Error("Supabase admin belum dikonfigurasi.");
  return fetch(`${env.url}${path}`, { ...init, cache: "no-store", headers: { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}`, "Content-Type": "application/json", ...init.headers } });
}

export const supabaseAdminAdapter = {
  async lookupAdminUser(userId: string): Promise<{ found: true; failure?: never } | { found: false; failure?: AdminAuthFailure }> {
    const response = await adminRequest(`/rest/v1/app_admin?singleton_key=eq.1&auth_user_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`);
    if (!response.ok) return { found: false, failure: { status: "dependency_unavailable", cause: new Error(`Admin lookup failed (${response.status})`) } };
    return ((await response.json()) as Array<{ id: string }>).length === 1 ? { found: true } : { found: false };
  },
  async getSingleton() {
    const response = await adminRequest("/rest/v1/app_admin?singleton_key=eq.1&select=id,auth_user_id,email&limit=1");
    if (!response.ok) throw new Error(`Admin lookup failed (${response.status})`);
    return ((await response.json()) as AdminRow[])[0] ?? null;
  },
  async isAdminUser(userId: string) {
    const result = await this.lookupAdminUser(userId);
    if (result.failure) throw result.failure.status === "dependency_unavailable" && result.failure.cause instanceof Error ? result.failure.cause : new Error("Admin lookup unavailable.");
    return result.found;
  },
  async insertBootstrapToken(tokenHash: string, expiresAt: string) {
    const response = await adminRequest("/rest/v1/admin_bootstrap_tokens", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ token_hash: tokenHash, expires_at: expiresAt }) });
    return response.ok;
  },
  async isBootstrapTokenValid(tokenHash: string) {
    const response = await adminRequest(`/rest/v1/admin_bootstrap_tokens?token_hash=eq.${encodeURIComponent(tokenHash)}&used_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id&limit=1`);
    if (!response.ok) return false;
    return ((await response.json()) as Array<{ id: string }>).length === 1;
  },
  async createAuthUser(email: string, password: string) {
    const response = await adminRequest("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) });
    if (!response.ok) throw new Error(`Auth user creation failed (${response.status})`);
    return response.json() as Promise<{ id: string; email?: string }>;
  },
  async deleteAuthUser(userId: string) {
    await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
  },
  async claimFirstAdmin(userId: string, email: string, tokenHash: string) {
    const response = await adminRequest("/rest/v1/rpc/claim_first_app_admin", { method: "POST", body: JSON.stringify({ p_auth_user_id: userId, p_email: email, p_token_hash: tokenHash }) });
    if (!response.ok) return false;
    return (await response.json()) === true;
  },
  async signIn(email: string, password: string) {
    const env = getSupabasePublicEnv();
    if (!env) throw new Error("Supabase public belum dikonfigurasi.");
    const response = await fetch(`${env.url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: env.anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<AuthSession>;
  },
  async revoke(accessToken: string) {
    const env = getSupabasePublicEnv();
    if (!env) return;
    await fetch(`${env.url}/auth/v1/logout`, { method: "POST", headers: { apikey: env.anonKey, Authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
  },
  async revokeAllAuth(accessToken: string) { const env = getSupabasePublicEnv(); if (!env) return; await fetch(`${env.url}/auth/v1/logout?scope=global`, { method: "POST", headers: { apikey: env.anonKey, Authorization: `Bearer ${accessToken}` } }); },
  async adminRpc<T>(name: string, body: object): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const r = await adminRequest(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(body), signal: controller.signal });
      if (!r.ok) throw new Error(`Admin RPC failed (${r.status})`);
      return r.json() as Promise<T>;
    } finally {
      clearTimeout(timeout);
    }
  },
  async consumeSharedRateLimit(keyHash: string, limit: number, windowSeconds: number) {
    return this.adminRpc<boolean>("consume_shared_rate_limit", {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
  },
  /**
   * Records one active customer/recipient session (table customer_sessions,
   * migration 202611180002). Fail-open: if the table is not deployed yet the
   * error is logged and the session exchange continues.
   */
  async registerCustomerSession(input: { weddingSlug: string; subjectType: "customer" | "recipient"; subjectId: string; tokenHash: string; deviceHash: string }) {
    try {
      const response = await adminRequest("/rest/v1/customer_sessions", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ wedding_slug: input.weddingSlug, subject_type: input.subjectType, subject_id: input.subjectId, token_hash: input.tokenHash, device_hash: input.deviceHash, last_seen_at: new Date().toISOString() }) });
      if (!response.ok) throw new Error(`Customer session registration failed (${response.status})`);
    } catch (error) {
      console.warn("[customer-session] register-unavailable", { code: error instanceof Error ? error.message.slice(0, 80) : "unknown" });
    }
  },
  /**
   * Enforces the per-subject active-session cap by revoking the oldest
   * sessions (by last_seen_at) when `limit` is already reached, making room
   * for the session about to be registered. Fail-open: if the table is not
   * deployed yet (or the lookup fails) the error is logged and enforcement
   * is skipped — the exchange still proceeds.
   */
  async enforceCustomerSessionLimit(weddingSlug: string, subjectType: "customer" | "recipient", subjectId: string, limit: number) {
    try {
      const query = `wedding_slug=eq.${encodeURIComponent(weddingSlug)}&subject_type=eq.${encodeURIComponent(subjectType)}&subject_id=eq.${encodeURIComponent(subjectId)}&revoked_at=is.null&select=id,last_seen_at&order=last_seen_at.asc`;
      const response = await adminRequest(`/rest/v1/customer_sessions?${query}`);
      if (!response.ok) throw new Error(`Customer session lookup failed (${response.status})`);
      const rows = await response.json() as Array<{ id: string; last_seen_at: string }>;
      for (const id of selectCustomerSessionsToEvict(rows, limit)) {
        const revoked = await adminRequest(`/rest/v1/customer_sessions?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
        if (!revoked.ok) throw new Error(`Customer session revoke failed (${revoked.status})`);
      }
    } catch (error) {
      console.warn("[customer-session] limit-enforcement-unavailable", { code: error instanceof Error ? error.message.slice(0, 80) : "unknown" });
    }
  },
  async recordEvent(body: object) { const r = await adminRequest("/rest/v1/admin_security_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error("Security event failed"); },
  async registerSession(sessionId: string, userId: string) { const r = await adminRequest("/rest/v1/admin_auth_sessions?on_conflict=session_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ session_id: sessionId, auth_user_id: userId, last_seen_at: new Date().toISOString() }) }); if (!r.ok) throw new Error("Session registration failed"); },
  async getSession(sessionId: string) { const r = await adminRequest(`/rest/v1/admin_auth_sessions?session_id=eq.${encodeURIComponent(sessionId)}&select=created_at,last_seen_at,revoked_at&limit=1`); if (!r.ok) throw new Error(`Admin session lookup failed (${r.status})`); return ((await r.json()) as Array<{ created_at: string; last_seen_at: string; revoked_at: string | null }>)[0] ?? null; },
  async touchSession(sessionId: string) { await adminRequest(`/rest/v1/admin_auth_sessions?session_id=eq.${encodeURIComponent(sessionId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_seen_at: new Date().toISOString() }) }); },
  async revokeAllSessions(userId: string) { await adminRequest(`/rest/v1/admin_auth_sessions?auth_user_id=eq.${encodeURIComponent(userId)}&revoked_at=is.null`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: new Date().toISOString() }) }); },
  async hasRecentReauth(sessionId: string) { const since = new Date(Date.now() - 10 * 60_000).toISOString(); const r = await adminRequest(`/rest/v1/admin_recent_reauth?session_id=eq.${encodeURIComponent(sessionId)}&verified_at=gte.${encodeURIComponent(since)}&select=session_id&limit=1`); if (!r.ok) throw new Error(`Recent reauthentication lookup failed (${r.status})`); return ((await r.json()) as unknown[]).length === 1; },
  async markRecentReauth(sessionId: string) { const r = await adminRequest("/rest/v1/admin_recent_reauth?on_conflict=session_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ session_id: sessionId, verified_at: new Date().toISOString() }) }); if (!r.ok) throw new Error("Reauth state failed"); },
  async listEvents() { const r = await adminRequest("/rest/v1/admin_security_events?select=event_type,success,created_at,metadata&order=created_at.desc&limit=50"); if (!r.ok) throw new Error("Event lookup failed"); return r.json() as Promise<Array<{ event_type: string; success: boolean; created_at: string; metadata: Record<string, unknown> }>>; },
};
