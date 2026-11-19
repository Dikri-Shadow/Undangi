import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { createCustomerAccess, listCustomerAccess, revokeCustomerAccess } from "@/services/admin-guest-access-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

const uuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
async function wedding(id: string) { return uuid(id) ? supabaseCmsAdapter.getById(id) : null; }
const bad = (status = 503) => NextResponse.json({ error: "Operasi akses customer belum dapat diproses." }, { status, headers: { "Cache-Control": "no-store" } });

/** Lists personal owner tokens (no hashes, no raw tokens). Requires admin session. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return bad(401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try { return NextResponse.json({ access: await listCustomerAccess(row.slug) }, { headers: { "Cache-Control": "no-store" } }); } catch { return bad(); }
}

/**
 * Creates a personal owner token. The raw token is returned ONCE in this
 * response; only its hash is stored. Requires admin session + same origin.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin || !(await isSameOrigin(request))) return bad(admin ? 403 : 401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try {
    const body = await request.json() as { label?: unknown };
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "owner";
    if (label.length > 120) return bad(400);
    const created = await createCustomerAccess(row.slug, label);
    return NextResponse.json({ ...created, url: `${new URL(request.url).origin}/${encodeURIComponent(row.slug)}/generate#access=${created.token}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return bad(); }
}

/** Revokes a personal owner token. Requires admin session + same origin. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin || !(await isSameOrigin(request))) return bad(admin ? 403 : 401);
  const row = await wedding((await params).id);
  if (!row) return bad(404);
  try { const body = await request.json() as { accessId?: unknown }; if (typeof body.accessId !== "string") return bad(400); await revokeCustomerAccess(row.slug, body.accessId); return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } }); } catch { return bad(); }
}
