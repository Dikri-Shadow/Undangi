import { NextResponse } from "next/server";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { createRecipient, listRecipientsWithRsvp, revokeRecipient, updateRecipient, validateCustomerSessionToken } from "@/services/admin-guest-access-service";
import { CUSTOMER_SESSION_COOKIE, openCustomerSession, sealCustomerSession, CUSTOMER_ABSOLUTE_TTL } from "@/lib/customer-session";
import { calculateRsvpStats } from "@/lib/rsvp-report";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const genericDenied = () => NextResponse.json({ error: "Link akses customer tidak valid." }, { status: 401, headers: { "Cache-Control": "no-store" } });
const genericDependencyFailure = () => NextResponse.json({ error: "Layanan customer belum dapat memproses permintaan." }, { status: 503, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  if (!slugPattern.test(slug) || slug.length > 80) return genericDenied();
  const url = new URL(request.url);
  if (url.searchParams.has("token")) return genericDenied();
  let session;
  try {
    session = await sessionFor(request, slug);
  } catch {
    return genericDependencyFailure();
  }
  if (session) {
    try {
      const rows = await listRecipientsWithRsvp(slug);
      const reportRows = rows.map((row) => ({ id: row.id, guestName: row.guestName, rsvp: row.rsvp ? { guestName: row.guestName, attendance: row.rsvp.attendance, guestCount: row.rsvp.guestCount, message: row.rsvp.message, createdAt: row.rsvp.createdAt } : null }));
      const report = calculateRsvpStats([], reportRows);
      const stats = { total: report.totalRecipients, hadir: report.attending, tidak: report.declined, belum: report.pending, totalGuests: report.guests };
      const response = NextResponse.json({ recipients: rows.map((row) => ({ id: row.id, guestName: row.guestName, createdAt: row.createdAt, updatedAt: row.updatedAt, rsvpStatus: row.rsvp ? row.rsvp.attendance : "belum", guestCount: row.rsvp ? row.rsvp.guestCount : 0 })), stats }, { headers: { "Cache-Control": "no-store" } });
      response.cookies.set(CUSTOMER_SESSION_COOKIE, sealCustomerSession(slug, session.token, Date.now(), session.issuedAt), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CUSTOMER_ABSOLUTE_TTL }); return response;
    } catch {
      return genericDependencyFailure();
    }
  }
  return genericDenied();
}

async function sessionFor(request: Request, slug: string) {
  const cookie = request.headers.get("cookie")?.match(new RegExp(`${CUSTOMER_SESSION_COOKIE}=([^;]+)`))?.[1];
  const session = cookie ? openCustomerSession(cookie) : null;
  if (!session || session.slug !== slug || !(await validateCustomerSessionToken(slug, session.token))) return null;
  return session;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug; const session = await sessionFor(request, slug);
  if (!session || !sameOrigin(request)) return genericDenied();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("customer-mutation", `${slug}:${ip}`, 30, 60)) === "blocked") return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  try { const body = await request.json() as { guestName?: unknown }; if (typeof body.guestName !== "string" || !body.guestName.trim() || body.guestName.length > 120) return NextResponse.json({ error: "Nama tamu tidak valid." }, { status: 400, headers: { "Cache-Control": "no-store" } }); const row = await createRecipient(slug, body.guestName.trim()); return NextResponse.json({ recipient: { id: row.id, guestName: row.guestName, token: row.token, createdAt: row.createdAt, updatedAt: row.updatedAt } }, { status: 201, headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Recipient belum dapat dibuat." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug; const session = await sessionFor(request, slug);
  if (!session || !sameOrigin(request)) return genericDenied();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("customer-mutation", `${slug}:${ip}`, 30, 60)) === "blocked") return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  try { const body = await request.json() as { id?: unknown; guestName?: unknown }; if (typeof body.id !== "string" || typeof body.guestName !== "string" || !body.guestName.trim() || body.guestName.length > 120) return NextResponse.json({ error: "Recipient tidak valid." }, { status: 400, headers: { "Cache-Control": "no-store" } }); const row = await updateRecipient(slug, body.id, body.guestName.trim()); return row ? NextResponse.json({ recipient: row }, { headers: { "Cache-Control": "no-store" } }) : genericDenied(); } catch { return NextResponse.json({ error: "Recipient belum dapat diperbarui." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug; const session = await sessionFor(request, slug);
  if (!session || !sameOrigin(request)) return genericDenied();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if ((await allowSharedRequest("customer-mutation", `${slug}:${ip}`, 30, 60)) === "blocked") return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  try { const body = await request.json() as { id?: unknown }; if (typeof body.id !== "string") return NextResponse.json({ error: "Recipient tidak valid." }, { status: 400, headers: { "Cache-Control": "no-store" } }); await revokeRecipient(slug, body.id); return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Recipient belum dapat dihapus." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
