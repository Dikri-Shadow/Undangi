import { NextResponse } from "next/server";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE } from "./admin-auth";

export type AdminSession = { access_token: string; refresh_token: string; expires_in?: number };

export function withAdminSession(session: AdminSession, body: object = { ok: true }) {
  const response = NextResponse.json(body);
  response.headers.set("Cache-Control", "no-store, private");
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_ACCESS_COOKIE, session.access_token, { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: session.expires_in || 3600 });
  response.cookies.set(ADMIN_REFRESH_COOKIE, session.refresh_token, { httpOnly: true, secure, sameSite: "strict", path: "/api/admin/auth", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
