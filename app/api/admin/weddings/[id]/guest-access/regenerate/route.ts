/**
 * @deprecated Legacy wedding-wide customer token regeneration (table
 * wedding_guest_access). Still functional until
 * LEGACY_CUSTOMER_TOKEN_ENABLED=false. Use personal owner tokens via
 * app/api/admin/weddings/[id]/customer-access/route.ts instead.
 */
import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isAdminAuthDependencyFailure, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
import { createCustomerToken, rotateGuestAccess } from "@/services/admin-guest-access-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { let admin; try { admin = await requireAdminApi(); } catch (error) { return isAdminAuthDependencyFailure(error) ? adminAuthFailureResponse(error) : adminAuthFailureResponse(error); } if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 }); if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 }); const id = (await params).id; if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); const wedding = await supabaseCmsAdapter.getById(id); if (!wedding) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); try { const token = createCustomerToken(); const rotated = await rotateGuestAccess(wedding.slug, token.hash); return NextResponse.json({ ...rotated, url: `${new URL(request.url).origin}/${encodeURIComponent(wedding.slug)}/generate#access=${token.raw}` }); } catch (error) { const typed = error as Error & { code?: string }; return typed.code === "P0002" ? NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }) : NextResponse.json({ error: "Gagal membuat ulang token akses customer." }, { status: 503 }); } }
