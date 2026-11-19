import { NextResponse } from "next/server";
import { createNewWeddingConfig } from "@/data/wedding-config";
import { adminAuthFailureResponse, adminAuthPort, requireAdminApi, isSameOrigin } from "@/lib/admin-auth";
import { createWeddingSchema } from "@/lib/cms-validation";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export async function GET() { const auth = await adminAuthPort.authenticate("admin"); if (!auth.ok) return adminAuthFailureResponse(auth.failure); try { return NextResponse.json(await supabaseCmsAdapter.list()); } catch { return NextResponse.json({ error: "Data undangan belum dapat dimuat." }, { status: 503 }); } }
export async function POST(request: Request) {
  let user; try { user = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); } if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const parsed = createWeddingSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid." }, { status: 400 });
  const { brideName, groomName, brideNickname = "", groomNickname = "", slug } = parsed.data;
  const config = createNewWeddingConfig({ slug, brideName, groomName, brideNickname, groomNickname });
  try { return NextResponse.json(await supabaseCmsAdapter.create(config, user.email), { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message.includes("409") ? "Slug sudah digunakan." : "Undangan belum dapat dibuat." }, { status: 503 }); }
}
