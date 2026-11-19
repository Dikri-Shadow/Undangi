import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_ACCESS_COOKIE, adminAuthFailureResponse, isSameOrigin, requireRecentAdminApi } from "@/lib/admin-auth";
import { adminPasswordChangeSchema } from "@/lib/admin-bootstrap";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { getSupabasePublicEnv } from "@/lib/supabase-env";
import { recordSecurityEvent } from "@/lib/admin-security";

export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403, headers: noStore });
  let user; try { user = await requireRecentAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!user) return NextResponse.json({ error: "Konfirmasi password terbaru diperlukan." }, { status: 428, headers: noStore });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("admin-password", ip, 3, 600)) === "blocked") return NextResponse.json({ error: "Terlalu banyak percobaan." }, { status: 429, headers: noStore });
  const parsed = adminPasswordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Password tidak valid." }, { status: 400, headers: noStore });
  const env = getSupabasePublicEnv(); const token = (await cookies()).get(ADMIN_ACCESS_COOKIE)?.value;
  if (!env || !token) return NextResponse.json({ error: "Session tidak tersedia." }, { status: 401, headers: noStore });
  const response = await fetch(`${env.url}/auth/v1/user`, { method: "PUT", headers: { apikey: env.anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password: parsed.data.password }) });
  if (response.ok) await recordSecurityEvent(request, "security_change", true, user.sessionId, { operation: "password_change" });
  return response.ok ? NextResponse.json({ ok: true }, { headers: noStore }) : NextResponse.json({ error: "Password belum dapat diubah." }, { status: 400, headers: noStore });
}
