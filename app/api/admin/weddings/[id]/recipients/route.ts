import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { createRecipient, listActiveRecipients, revokeRecipient, rotateRecipientToken, updateRecipient } from "@/services/admin-guest-access-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

const uuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
async function wedding(id: string) { return uuid(id) ? supabaseCmsAdapter.getById(id) : null; }
const bad = (status = 503) => NextResponse.json({ error: "Operasi recipient belum dapat diproses." }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return bad(401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try { return NextResponse.json({ recipients: await listActiveRecipients(row.slug) }, { headers: { "Cache-Control": "no-store" } }); } catch { return bad(); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin || !(await isSameOrigin(request))) return bad(admin ? 403 : 401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try { const body = await request.json() as { guestName?: unknown }; if (typeof body.guestName !== "string" || body.guestName.trim().length < 1 || body.guestName.trim().length > 120) return bad(400); return NextResponse.json(await createRecipient(row.slug, body.guestName.trim()), { status: 201, headers: { "Cache-Control": "no-store" } }); } catch { return bad(); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin || !(await isSameOrigin(request))) return bad(admin ? 403 : 401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try { const body = await request.json() as { recipientId?: unknown; guestName?: unknown; rotateToken?: unknown }; if (typeof body.recipientId !== "string") return bad(400); if (body.rotateToken === true) return NextResponse.json(await rotateRecipientToken(row.slug, body.recipientId), { headers: { "Cache-Control": "no-store" } }); if (typeof body.guestName !== "string" || !body.guestName.trim()) return bad(400); const updated = await updateRecipient(row.slug, body.recipientId, body.guestName.trim()); return updated ? NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } }) : bad(404); } catch { return bad(); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin || !(await isSameOrigin(request))) return bad(admin ? 403 : 401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try { const body = await request.json() as { recipientId?: unknown }; if (typeof body.recipientId !== "string") return bad(400); await revokeRecipient(row.slug, body.recipientId); return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } }); } catch { return bad(); }
}
