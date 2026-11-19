import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isAdminAuthDependencyFailure, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const source = await supabaseCmsAdapter.getById((await params).id).catch(() => null);
  if (!source) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
  const config = structuredClone(source.weddingData);
  config.slug = `${source.slug}-copy-${Date.now().toString().slice(-6)}`;
  config.metadata.title = `${config.metadata.title} (Copy)`;
  config.metadata.canonicalUrl = `${config.metadata.siteUrl}/${config.slug}`;
  config.metadata.weddingUrl = config.metadata.canonicalUrl;
  config.metadata.shareUrl = config.metadata.canonicalUrl;
  try { return NextResponse.json(await supabaseCmsAdapter.create(config, user.email), { status: 201 }); }
  catch (error) { if (isAdminAuthDependencyFailure(error)) return adminAuthFailureResponse(error); return NextResponse.json({ error: "Undangan belum dapat diduplikasi." }, { status: 503 }); }
}
