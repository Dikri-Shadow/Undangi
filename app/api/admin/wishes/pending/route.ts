import { NextResponse } from "next/server";
import { adminAuthFailureResponse, requireAdminApi } from "@/lib/admin-auth";
import { listAdminPendingWishes } from "@/services/admin-responses-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
export async function GET() {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  try {
    const [pending, weddings] = await Promise.all([listAdminPendingWishes(), supabaseCmsAdapter.list()]);
    const active = new Map(weddings.filter((row) => row.status === "published" && row.deletedAt === null).map((row) => [row.slug, row.weddingData.couple.display]));
    return NextResponse.json({ items: pending.filter((row) => active.has(row.weddingSlug)).map((row) => ({ ...row, weddingLabel: active.get(row.weddingSlug) })) });
  } catch { return NextResponse.json({ error: "Notifikasi ucapan belum dapat dimuat." }, { status: 503 }); }
}
