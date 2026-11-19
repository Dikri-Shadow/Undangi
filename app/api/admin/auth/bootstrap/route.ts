import { NextResponse } from "next/server";
import { adminBootstrapSchema, hashBootstrapToken } from "@/lib/admin-bootstrap";
import { isSameOrigin } from "@/lib/admin-auth";
import { withAdminSession } from "@/lib/admin-session";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
import { isLocalDevelopmentRequest, isTurnstileConfigured, verifyTurnstile } from "@/lib/admin-security";
import { adminRateLimitKey } from "@/lib/admin-development";

export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("admin-bootstrap", adminRateLimitKey(request, "admin-bootstrap", ip), 3, 600)) === "blocked") return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  const parsed = adminBootstrapSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid." }, { status: 400 });
  const tokenHash = hashBootstrapToken(parsed.data.setupToken);
  let authUserId: string | null = null;
  try {
    if (!isLocalDevelopmentRequest(request) && isTurnstileConfigured() && !(await verifyTurnstile(parsed.data.turnstileToken, ip))) return NextResponse.json({ error: "Setup tidak tersedia." }, { status: 403 });
    if (await supabaseAdminAdapter.getSingleton() || !(await supabaseAdminAdapter.isBootstrapTokenValid(tokenHash))) return NextResponse.json({ error: "Setup tidak tersedia." }, { status: 409 });
    const user = await supabaseAdminAdapter.createAuthUser(parsed.data.email, parsed.data.password); authUserId = user.id;
    const claimed = await supabaseAdminAdapter.claimFirstAdmin(user.id, parsed.data.email, tokenHash);
    if (!claimed) { await supabaseAdminAdapter.deleteAuthUser(user.id); return NextResponse.json({ error: "Setup tidak tersedia." }, { status: 409 }); }
    const session = await supabaseAdminAdapter.signIn(parsed.data.email, parsed.data.password);
    if (!session) return NextResponse.json({ error: "Admin dibuat, silakan masuk." }, { status: 201 });
    return withAdminSession(session);
  } catch {
    if (authUserId) await supabaseAdminAdapter.deleteAuthUser(authUserId).catch(() => undefined);
    return NextResponse.json({ error: "Admin belum dapat dibuat." }, { status: 503 });
  }
}
