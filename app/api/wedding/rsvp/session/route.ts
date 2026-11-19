import { NextResponse } from "next/server";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { CUSTOMER_ABSOLUTE_TTL, getCustomerSessionDeviceLimit, hashDeviceFingerprint, RECIPIENT_SESSION_COOKIE, sealRecipientSession } from "@/lib/customer-session";
import { hashCustomerToken, resolveRecipientToken, validateRecipientSession } from "@/services/admin-guest-access-service";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";

export async function POST(request: Request) {
  const origin = request.headers.get("origin"); if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("recipient-session", ip, 10, 60)) === "blocked") return NextResponse.json({ error: "Terlalu banyak percobaan." }, { status: 429 });
  try {
    const body = await request.json() as { slug?: unknown; recipientId?: unknown; token?: unknown };
    const slug = typeof body.slug === "string" ? body.slug : "", suppliedId = typeof body.recipientId === "string" ? body.recipientId : "", token = typeof body.token === "string" ? body.token : "";
    // Token personal kini 16 karakter (randomBytes 12); batas bawah 16 tetap
    // menerima token lama 43 karakter — validasi sebenarnya lewat hash di DB.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || token.length < 16 || token.length > 100) return NextResponse.json({ error: "Link recipient tidak valid." }, { status: 401 });
    const resolved = suppliedId ? { id: suppliedId, name: "" } : await resolveRecipientToken(slug, token);
    if (!resolved || !/^[0-9a-f-]{36}$/i.test(resolved.id) || !(await validateRecipientSession(slug, resolved.id, token))) return NextResponse.json({ error: "Link recipient tidak valid." }, { status: 401 });
    // Device-limit enforcement (fail-open while customer_sessions is not deployed) before the cookie is set.
    await supabaseAdminAdapter.enforceCustomerSessionLimit(slug, "recipient", resolved.id, getCustomerSessionDeviceLimit());
    await supabaseAdminAdapter.registerCustomerSession({ weddingSlug: slug, subjectType: "recipient", subjectId: resolved.id, tokenHash: hashCustomerToken(token), deviceHash: hashDeviceFingerprint(request.headers.get("user-agent")) });
    const response = NextResponse.json({ ok: true, recipient: { id: resolved.id, name: resolved.name } }, { headers: { "Cache-Control": "no-store" } }); response.cookies.set(RECIPIENT_SESSION_COOKIE, sealRecipientSession(slug, resolved.id, token), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CUSTOMER_ABSOLUTE_TTL }); return response;
  } catch { return NextResponse.json({ error: "Layanan recipient belum tersedia." }, { status: 503 }); }
}
