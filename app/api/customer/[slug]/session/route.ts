import { NextResponse } from "next/server";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { CUSTOMER_ABSOLUTE_TTL, CUSTOMER_SESSION_COOKIE, getCustomerSessionDeviceLimit, hashDeviceFingerprint, sealCustomerSession } from "@/lib/customer-session";
import { hashCustomerToken, validateCustomerSessionToken } from "@/services/admin-guest-access-service";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";

const denied = () => NextResponse.json({ error: "Link akses customer tidak valid." }, { status: 401, headers: { "Cache-Control": "no-store" } });
const noStore = (response: NextResponse) => { response.headers.set("Cache-Control", "no-store"); return response; };

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug; const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("customer-exchange", ip, 10, 60)) === "blocked") return noStore(NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 }));
  const origin = request.headers.get("origin"); if (origin && new URL(origin).origin !== new URL(request.url).origin) return noStore(NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 }));
  try {
    const body = await request.json() as { token?: unknown }; const token = typeof body.token === "string" ? body.token : "";
    // Personal owner token first, legacy wedding-wide token second (still 401 when both fail).
    // Token personal kini 16 karakter (randomBytes 12); batas bawah 16 tetap
    // menerima token lama 43 karakter — validasi sebenarnya lewat hash di DB.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || token.length < 16 || token.length > 100 || !(await validateCustomerSessionToken(slug, token))) return denied();
    // Device-limit enforcement (fail-open while customer_sessions is not deployed) before the cookie is set.
    await supabaseAdminAdapter.enforceCustomerSessionLimit(slug, "customer", slug, getCustomerSessionDeviceLimit());
    await supabaseAdminAdapter.registerCustomerSession({ weddingSlug: slug, subjectType: "customer", subjectId: slug, tokenHash: hashCustomerToken(token), deviceHash: hashDeviceFingerprint(request.headers.get("user-agent")) });
    const response = noStore(NextResponse.json({ ok: true })); response.cookies.set(CUSTOMER_SESSION_COOKIE, sealCustomerSession(slug, token), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CUSTOMER_ABSOLUTE_TTL }); return response;
  } catch { return noStore(NextResponse.json({ error: "Layanan customer belum tersedia." }, { status: 503 })); }
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin"); if (origin && new URL(origin).origin !== new URL(request.url).origin) return noStore(NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 }));
  const response = noStore(NextResponse.json({ ok: true })); response.cookies.set(CUSTOMER_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); return response;
}
