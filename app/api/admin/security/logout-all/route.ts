import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireRecentAdminApi } from "@/lib/admin-auth";
import { recordSecurityEvent } from "@/lib/admin-security";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
import { cookies } from "next/headers";
export async function POST(request: Request) { if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 }); let user; try { user = await requireRecentAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!user) return NextResponse.json({ error: "Konfirmasi password terbaru diperlukan." }, { status: 428 }); const token = (await cookies()).get("undangi_admin_access")?.value; await supabaseAdminAdapter.revokeAllSessions(user.id); if (token) await supabaseAdminAdapter.revokeAllAuth(token); await recordSecurityEvent(request, "logout_all", true, user.sessionId); const response = NextResponse.json({ ok: true }); response.cookies.delete("undangi_admin_access"); response.cookies.delete("undangi_admin_refresh"); response.headers.set("Cache-Control", "no-store"); return response; }
