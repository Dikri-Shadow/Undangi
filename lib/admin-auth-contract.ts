export type AdminAuthFailure =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "reauthentication_required" }
  | { status: "dependency_unavailable"; cause?: unknown };

export type AdminPrincipal = {
  id: string;
  email: string;
  sessionId: string;
};

export type RecentAdminPrincipal = AdminPrincipal & {
  reauthenticatedAt: string;
};

export type AdminAuthResult<T extends AdminPrincipal = AdminPrincipal> =
  | { ok: true; principal: T }
  | { ok: false; failure: AdminAuthFailure };

export interface AdminAuthPort {
  authenticate(policy: "admin" | "recent"): Promise<AdminAuthResult>;
}

export type AdminAuthDependencies = {
  getAccessToken: () => Promise<string | undefined>;
  getPublicEnv: () => { url: string; anonKey: string } | null | undefined;
  fetchUser: (url: string, init: RequestInit) => Promise<Response>;
  isAdminUser: (userId: string) => Promise<boolean>;
  getSession: (sessionId: string) => Promise<{ created_at: string; last_seen_at: string; revoked_at: string | null } | null>;
  touchSession: (sessionId: string) => Promise<void>;
  hasRecentReauth: (sessionId: string) => Promise<boolean>;
};
