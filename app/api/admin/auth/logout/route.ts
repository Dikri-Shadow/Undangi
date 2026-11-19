import { NextResponse } from "next/server";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE, isSameOrigin } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
import { decodeClaims, recordSecurityEvent } from "@/lib/admin-security";
export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const accessToken = (await cookies()).get(ADMIN_ACCESS_COOKIE)?.value;
  const sessionId = accessToken ? decodeClaims(accessToken)?.session_id : undefined;
  if (accessToken) await supabaseAdminAdapter.revoke(accessToken);
  await recordSecurityEvent(request, "logout", true, sessionId);
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store, private");
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_ACCESS_COOKIE, "", { httpOnly: true, secure, sameSite: "strict", expires: new Date(0), path: "/" });
  response.cookies.set(ADMIN_REFRESH_COOKIE, "", { httpOnly: true, secure, sameSite: "strict", expires: new Date(0), path: "/api/admin/auth" });
  return response;
}
