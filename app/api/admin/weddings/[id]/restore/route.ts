import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { recordSecurityEvent } from "@/lib/admin-security";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!user) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const id = (await params).id; const existing = await supabaseCmsAdapter.getDeletedById(id).catch(() => null);
  if (!existing) {
    const active = await supabaseCmsAdapter.getById(id).catch(() => null);
    return active ? NextResponse.json({ ok: true, alreadyActive: true, message: "Undangan sudah aktif." }) : NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
  }
  const restored = await supabaseCmsAdapter.restore(id, user.email).catch(() => null);
  if (!restored) {
    const active = await supabaseCmsAdapter.getById(id).catch(() => null);
    return active ? NextResponse.json({ ok: true, alreadyActive: true, message: "Undangan sudah aktif." }) : NextResponse.json({ error: "Undangan tidak dapat dipulihkan. Slug mungkin sudah digunakan undangan lain." }, { status: 409 });
  }
  await recordSecurityEvent(request, "wedding_restore", true, user.sessionId, { weddingId: id, slug: existing.slug });
  return NextResponse.json({ ok: true });
}
