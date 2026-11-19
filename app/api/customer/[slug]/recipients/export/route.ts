import { NextResponse } from "next/server";
import { listRecipientsWithRsvp, validateCustomerSessionToken } from "@/services/admin-guest-access-service";
import { CUSTOMER_SESSION_COOKIE, openCustomerSession, sealCustomerSession, CUSTOMER_ABSOLUTE_TTL } from "@/lib/customer-session";
import { buildRecipientReportCsv, buildWhatsAppReport, calculateRsvpStats } from "@/lib/rsvp-report";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const genericDenied = () => NextResponse.json({ error: "Link akses customer tidak valid." }, { status: 401, headers: { "Cache-Control": "no-store" } });
const genericDependencyFailure = () => NextResponse.json({ error: "Layanan customer belum dapat memproses permintaan." }, { status: 503, headers: { "Cache-Control": "no-store" } });

async function sessionFor(request: Request, slug: string) {
  const cookie = request.headers.get("cookie")?.match(new RegExp(`${CUSTOMER_SESSION_COOKIE}=([^;]+)`))?.[1];
  const session = cookie ? openCustomerSession(cookie) : null;
  if (!session || session.slug !== slug || !(await validateCustomerSessionToken(slug, session.token))) return null;
  return session;
}

/**
 * Customer RSVP report export. Same customer session as the recipients list.
 * ?format=csv → text/csv attachment (all recipients, including "Belum mengisi").
 * ?format=whatsapp → text/plain summary from buildWhatsAppReport.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  if (!slugPattern.test(slug) || slug.length > 80) return genericDenied();
  const url = new URL(request.url);
  if (url.searchParams.has("token")) return genericDenied();
  const format = url.searchParams.get("format");
  if (format !== "csv" && format !== "whatsapp") return NextResponse.json({ error: "Format laporan tidak valid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  let session;
  try {
    session = await sessionFor(request, slug);
  } catch {
    return genericDependencyFailure();
  }
  if (!session) return genericDenied();
  try {
    const rows = await listRecipientsWithRsvp(slug);
    const reportRows = rows.map((row) => ({ id: row.id, guestName: row.guestName, rsvp: row.rsvp ? { guestName: row.guestName, attendance: row.rsvp.attendance, guestCount: row.rsvp.guestCount, message: row.rsvp.message, createdAt: row.rsvp.createdAt } : null }));
    const stats = calculateRsvpStats([], reportRows);
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    let body: string;
    if (format === "csv") {
      body = buildRecipientReportCsv(reportRows);
      headers["Content-Type"] = "text/csv; charset=utf-8";
      headers["Content-Disposition"] = `attachment; filename="rsvp-${slug}.csv"`;
    } else {
      body = buildWhatsAppReport(slug, stats);
      headers["Content-Type"] = "text/plain; charset=utf-8";
    }
    const response = new NextResponse(body, { headers });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, sealCustomerSession(slug, session.token, Date.now(), session.issuedAt), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CUSTOMER_ABSOLUTE_TTL });
    return response;
  } catch {
    return genericDependencyFailure();
  }
}
