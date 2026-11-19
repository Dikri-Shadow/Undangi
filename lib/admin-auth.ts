import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "./supabase-env";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
import { decodeClaims } from "./admin-security";
import type { AdminAuthDependencies, AdminAuthFailure, AdminAuthPort, AdminAuthResult, AdminPrincipal, RecentAdminPrincipal } from "./admin-auth-contract";

export const ADMIN_ACCESS_COOKIE = "undangi_admin_access";
export const ADMIN_REFRESH_COOKIE = "undangi_admin_refresh";

export type AdminUser = { id: string; email: string; sessionId: string };
export type { AdminAuthDependencies, AdminAuthPort, AdminAuthResult, AdminPrincipal, RecentAdminPrincipal } from "./admin-auth-contract";

export type AdminAuthErrorKind = "dependency_failure";

export class AdminAuthError extends Error {
  readonly kind: AdminAuthErrorKind;
  readonly failure: Extract<AdminAuthFailure, { status: "dependency_unavailable" }>;

  constructor(message = "Admin authentication dependency unavailable.", kind: AdminAuthErrorKind = "dependency_failure", cause?: unknown) {
    super(message);
    this.name = "AdminAuthError";
    this.kind = kind;
    this.failure = { status: "dependency_unavailable", cause };
  }
}

export function isAdminAuthDependencyFailure(error: unknown): error is AdminAuthError {
  return error instanceof AdminAuthError && error.kind === "dependency_failure";
}

export function adminAuthFailureResponse(error: unknown) {
  const failure = isAdminAuthDependencyFailure(error) ? error.failure : (error as { failure?: AdminAuthFailure })?.failure;
  const status = failure?.status === "dependency_unavailable" ? 503 : failure?.status === "forbidden" || failure?.status === "reauthentication_required" ? 403 : 401;
  const message = status === 503 ? "Layanan autentikasi admin belum tersedia." : status === 403 ? "Akses admin memerlukan otorisasi tambahan." : "Sesi admin tidak valid.";
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function adminAuthFailureResult(error: unknown) {
  const failure = isAdminAuthDependencyFailure(error) ? error.failure : (error as { failure?: AdminAuthFailure })?.failure;
  return failure ? { ok: false as const, failure } : { ok: false as const, failure: { status: "dependency_unavailable" as const, cause: error } };
}

async function authenticateAdmin(policy: "admin" | "recent", dependencies: AdminAuthDependencies): Promise<AdminAuthResult> {
  try {
    const env = dependencies.getPublicEnv();
    if (!env) throw new AdminAuthError("Supabase public configuration unavailable.");
    const token = await dependencies.getAccessToken();
    if (!token) return { ok: false, failure: { status: "unauthenticated" } };
    const claims = decodeClaims(token);
    if (!claims?.sub || !claims.session_id) return { ok: false, failure: { status: "unauthenticated" } };
    const [response, isAdmin] = await Promise.all([
      dependencies.fetchUser(`${env.url}/auth/v1/user`, { headers: { apikey: env.anonKey, Authorization: `Bearer ${token}` }, cache: "no-store" }),
      dependencies.isAdminUser(claims.sub),
    ]);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return { ok: false, failure: { status: "unauthenticated" } };
      return { ok: false, failure: { status: "dependency_unavailable", cause: new Error(`Auth lookup failed (${response.status})`) } };
    }
    if (!isAdmin) return { ok: false, failure: { status: "forbidden" } };
    const user = await response.json() as { id?: string; email?: string };
    if (!user.id || user.id !== claims.sub || !user.email) return { ok: false, failure: { status: "unauthenticated" } };
    let session;
    try { session = await dependencies.getSession(claims.session_id); }
    catch { throw new AdminAuthError("Admin session dependency unavailable."); }
    const now = Date.now();
    if (!session || session.revoked_at || now - Date.parse(session.last_seen_at) > 30 * 60_000 || now - Date.parse(session.created_at) > 8 * 60 * 60_000) return { ok: false, failure: { status: "unauthenticated" } };
    if (now - Date.parse(session.last_seen_at) > 60_000) {
      try { await dependencies.touchSession(claims.session_id); }
      catch { throw new AdminAuthError("Admin session dependency unavailable."); }
    }
    const principal: AdminPrincipal = { id: user.id, email: user.email, sessionId: claims.session_id };
    if (policy === "recent") {
      let recent = false;
      try { recent = await dependencies.hasRecentReauth(principal.sessionId); }
      catch { throw new AdminAuthError("Recent reauthentication dependency unavailable."); }
      if (!recent) return { ok: false, failure: { status: "reauthentication_required" } };
      const recentPrincipal: RecentAdminPrincipal = { ...principal, reauthenticatedAt: new Date().toISOString() };
      return { ok: true, principal: recentPrincipal };
    }
    return { ok: true, principal };
  } catch (error) {
    if (error instanceof AdminAuthError) return { ok: false, failure: { status: "dependency_unavailable", cause: error } };
    return { ok: false, failure: { status: "dependency_unavailable", cause: error } };
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const result = await adminAuthPort.authenticate("admin");
  if (result.ok) return result.principal;
  if (result.failure.status === "dependency_unavailable") throw new AdminAuthError("Admin authentication dependency unavailable.", "dependency_failure", result.failure.cause);
  return null;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminApi() {
  const result = await adminAuthPort.authenticate("admin");
  if (result.ok) return result.principal;
  if (result.failure.status === "dependency_unavailable") throw new AdminAuthError("Admin authentication dependency unavailable.", "dependency_failure", result.failure.cause);
  return null;
}

export async function requireRecentAdminApi() {
  const result = await adminAuthPort.authenticate("recent");
  if (result.ok) return result.principal;
  if (result.failure.status === "dependency_unavailable") throw new AdminAuthError("Admin authentication dependency unavailable.", "dependency_failure", result.failure.cause);
  return null;
}

const defaultAdminAuthDependencies: AdminAuthDependencies = {
  getAccessToken: async () => (await cookies()).get(ADMIN_ACCESS_COOKIE)?.value,
  getPublicEnv: getSupabasePublicEnv,
  fetchUser: fetch,
  isAdminUser: (userId) => supabaseAdminAdapter.isAdminUser(userId),
  getSession: (sessionId) => supabaseAdminAdapter.getSession(sessionId),
  touchSession: (sessionId) => supabaseAdminAdapter.touchSession(sessionId),
  hasRecentReauth: (sessionId) => supabaseAdminAdapter.hasRecentReauth(sessionId),
};

export function createAdminAuthPort(dependencies: AdminAuthDependencies): AdminAuthPort {
  return { authenticate: (policy) => authenticateAdmin(policy, dependencies) };
}

export const adminAuthPort: AdminAuthPort = createAdminAuthPort(defaultAdminAuthDependencies);

export async function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const type = request.headers.get("content-type") || "";
  if (!origin || (!type.startsWith("application/json") && !type.startsWith("multipart/form-data"))) return false;
  return new URL(origin).origin === new URL(request.url).origin;
}
