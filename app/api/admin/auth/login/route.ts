import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/admin-bootstrap";
import { withAdminSession } from "@/lib/admin-session";
import { allowRequest } from "@/lib/rate-limit";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
import { decodeClaims, isLocalDevelopmentRequest, isTurnstileConfigured, privacyHash, recordSecurityEvent, verifyTurnstile } from "@/lib/admin-security";
import { adminRateLimitKey } from "@/lib/admin-development";
import { checkPersistentAdminLoginLimit } from "@/lib/admin-rate-limit";

export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403, headers: noStore });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const localDevelopment = isLocalDevelopmentRequest(request);
  const localQa = localDevelopment && process.env.UNDANGI_LOCAL_QA === "1";
  const keyHash = privacyHash(localDevelopment ? `development:${ip}` : ip);
  if (!localQa) {
    if (!allowRequest(adminRateLimitKey(request, "admin-login", ip), 5)) { console.warn("[admin-rate-limit] in-memory-rejected", { scope: "admin-login" }); await recordSecurityEvent(request, "login_rate_limited", false); return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429, headers: noStore }); }
    const persistentLimit = await checkPersistentAdminLoginLimit(keyHash, (hash) => supabaseAdminAdapter.adminRpc<boolean>("admin_login_allowed", { p_key_hash: hash }));
    if (persistentLimit === "blocked") { console.warn("[admin-rate-limit] persistent-rejected", { scope: "admin-login" }); await recordSecurityEvent(request, "login_rate_limited", false); return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429, headers: noStore }); }
    if (persistentLimit === "unavailable") return NextResponse.json({ error: "Layanan login tidak tersedia." }, { status: 503, headers: noStore });
  }
  const parsed = adminLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email atau password tidak valid." }, { status: 401, headers: noStore });
  try {
    if (!localDevelopment && isTurnstileConfigured() && !(await verifyTurnstile(parsed.data.turnstileToken, ip))) { await supabaseAdminAdapter.adminRpc("consume_admin_login_failure", { p_key_hash: keyHash }).catch(() => undefined); await recordSecurityEvent(request, "login_failed", false, undefined, { reason: "challenge" }); return NextResponse.json({ error: "Email atau password tidak valid." }, { status: 401, headers: noStore }); }
    const session = await supabaseAdminAdapter.signIn(parsed.data.email, parsed.data.password);
    if (!session?.user?.id || !(await supabaseAdminAdapter.isAdminUser(session.user.id))) { if (session?.access_token) await supabaseAdminAdapter.revoke(session.access_token); if (!localQa) await supabaseAdminAdapter.adminRpc("consume_admin_login_failure", { p_key_hash: keyHash }).catch(() => undefined); await recordSecurityEvent(request, "login_failed", false); return NextResponse.json({ error: "Email atau password tidak valid." }, { status: 401, headers: noStore }); }
    const claims = decodeClaims(session.access_token);
    if (!claims?.session_id) { await supabaseAdminAdapter.revoke(session.access_token); return NextResponse.json({ error: "Layanan login tidak tersedia." }, { status: 503, headers: noStore }); }
    await supabaseAdminAdapter.registerSession(claims.session_id, session.user.id);
    await recordSecurityEvent(request, "login_success", true, claims.session_id);
    return withAdminSession(session, { ok: true, next: "/admin" });
  } catch { return NextResponse.json({ error: "Layanan login tidak tersedia." }, { status: 503, headers: noStore }); }
}
