import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { updateWeddingSchema } from "@/lib/cms-validation";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";
import { recordSecurityEvent } from "@/lib/admin-security";

const invitationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { let user; try { user = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const row = await supabaseCmsAdapter.getById((await params).id).catch(() => null); return row ? NextResponse.json(row) : NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); }
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user; try { user = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const parsed = updateWeddingSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid." }, { status: 400 });
  const id = (await params).id; const existing = await supabaseCmsAdapter.getById(id).catch(() => null); const sensitive = Boolean(existing && (existing.slug !== parsed.data.weddingData.slug || (existing.status === "published" && parsed.data.status === "draft"))); if (sensitive && !(await supabaseAdminAdapter.hasRecentReauth(user.sessionId))) return NextResponse.json({ error: "Konfirmasi password terbaru diperlukan." }, { status: 428 });
  const data = parsed.data.weddingData;
  try { const row = await supabaseCmsAdapter.update(id, data as never, parsed.data.status, user.email); if (row && existing?.slug !== data.slug) await recordSecurityEvent(request, "slug_change", true, user.sessionId); if (row && existing?.status !== parsed.data.status) await recordSecurityEvent(request, parsed.data.status === "published" ? "publish" : "unpublish", true, user.sessionId); return row ? NextResponse.json(row) : NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); } catch { return NextResponse.json({ error: "Perubahan belum dapat disimpan. Periksa slug dan koneksi database." }, { status: 503 }); }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user; try { user = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!user) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const id = (await params).id;
  if (!invitationIdPattern.test(id)) return NextResponse.json({ error: "ID undangan tidak valid." }, { status: 400 });
  try {
    const existing = await supabaseCmsAdapter.getById(id);
    if (!existing) {
      const deleted = await supabaseCmsAdapter.getDeletedById(id);
      return deleted ? NextResponse.json({ error: "Undangan sudah berada di Sampah." }, { status: 409 }) : NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    }
    const deleted = await supabaseCmsAdapter.softDelete(id, user.email);
    if (!deleted) return NextResponse.json({ error: "Undangan sudah berada di Sampah." }, { status: 409 });
    await recordSecurityEvent(request, "wedding_delete", true, user.sessionId, { weddingId: id, slug: existing.slug });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus undangan." }, { status: 503 });
  }
}
