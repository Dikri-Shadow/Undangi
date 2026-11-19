import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { deleteAdminWish, updateAdminWishStatus } from "@/services/admin-responses-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const body = await request.json().catch(() => null) as { weddingSlug?: string; status?: string } | null;
  const id = (await params).id;
  if (!body?.weddingSlug || (body.status !== "approved" && body.status !== "rejected")) return NextResponse.json({ error: "Data moderasi tidak valid." }, { status: 400 });
  try { await updateAdminWishStatus(id, body.weddingSlug, body.status); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Status ucapan belum dapat diperbarui." }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const body = await request.json().catch(() => null) as { weddingSlug?: string } | null;
  if (!body?.weddingSlug) return NextResponse.json({ error: "Data ucapan tidak valid." }, { status: 400 });
  try { await deleteAdminWish((await params).id, body.weddingSlug); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Ucapan belum dapat dihapus." }, { status: 400 }); }
}
