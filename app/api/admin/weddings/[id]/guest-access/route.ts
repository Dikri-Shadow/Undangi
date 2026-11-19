/**
 * @deprecated Legacy wedding-wide customer token (table wedding_guest_access,
 * one token covering every recipient). Still functional until
 * LEGACY_CUSTOMER_TOKEN_ENABLED=false. New tokens should be personal owner
 * tokens via app/api/admin/weddings/[id]/customer-access/route.ts.
 */
import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
import { createCustomerToken, listGuestAccess, revokeGuestAccess, rotateGuestAccess } from "@/services/admin-guest-access-service";

async function authorizedWedding(id: string) { return (await supabaseCmsAdapter.getById(id)); }
function failure(error: unknown) { const typed = error as Error & { code?: string }; return typed.code === "P0002" ? NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }) : NextResponse.json({ error: "Layanan akses customer belum tersedia." }, { status: 503 }); }
function slugOf(id: string) { return /^[0-9a-f-]{36}$/i.test(id); }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { let admin; try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 }); const id = (await params).id; if (!slugOf(id)) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); const wedding = await authorizedWedding(id); if (!wedding) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); try { const active = (await listGuestAccess(wedding.slug)).find((row) => row.active); return NextResponse.json(active ?? { active: false }); } catch (error) { return failure(error); } }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { let admin; try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 }); if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 }); const id = (await params).id; if (!slugOf(id)) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); const wedding = await authorizedWedding(id); if (!wedding) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); try { if ((await listGuestAccess(wedding.slug)).some((row) => row.active)) return NextResponse.json({ error: "Token aktif sudah tersedia. Gunakan regenerasi." }, { status: 409 }); const token = createCustomerToken(); const rotated = await rotateGuestAccess(wedding.slug, token.hash); return NextResponse.json({ ...rotated, url: `${new URL(request.url).origin}/${encodeURIComponent(wedding.slug)}/generate#access=${token.raw}` }, { status: 201 }); } catch (error) { return failure(error); } }

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { let admin; try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 }); if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 }); const id = (await params).id; if (!slugOf(id)) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); const wedding = await authorizedWedding(id); if (!wedding) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); try { if (!(await listGuestAccess(wedding.slug)).some((row) => row.active)) return NextResponse.json({ active: false }); await revokeGuestAccess(wedding.slug); return NextResponse.json({ active: false }); } catch (error) { return failure(error); } }
