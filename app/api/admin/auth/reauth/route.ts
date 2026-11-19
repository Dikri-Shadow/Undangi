import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isAdminAuthDependencyFailure, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { recordSecurityEvent } from "@/lib/admin-security";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403, headers: noStore });
  let user; try { user = await requireAdminApi(); } catch (error) { return isAdminAuthDependencyFailure(error) ? NextResponse.json({ error: "Layanan autentikasi admin belum tersedia." }, { status: 503, headers: noStore }) : adminAuthFailureResponse(error); }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!body.password || body.password.length > 256) return NextResponse.json({ error: "Password tidak valid." }, { status: 400, headers: noStore });

  const temporarySession = await supabaseAdminAdapter.signIn(user.email, body.password).catch(() => null);
  const valid = Boolean(temporarySession?.user?.id === user.id && await supabaseAdminAdapter.isAdminUser(user.id));
  if (temporarySession?.access_token) await supabaseAdminAdapter.revoke(temporarySession.access_token);
  if (!valid) {
    await recordSecurityEvent(request, "password_reauth_failed", false, user.sessionId);
    return NextResponse.json({ error: "Password tidak valid." }, { status: 401, headers: noStore });
  }

  await supabaseAdminAdapter.markRecentReauth(user.sessionId);
  await recordSecurityEvent(request, "password_reauth_success", true, user.sessionId);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
