import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isAdminAuthDependencyFailure, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
import { isMediaSlot } from "@/lib/admin-photo";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "audio/mpeg"]);
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "audio/mpeg": "mp3" };
export async function POST(request: Request) {
  let user; try { user = await requireAdminApi(); } catch (error) { return isAdminAuthDependencyFailure(error) ? NextResponse.json({ error: "Layanan autentikasi admin belum tersedia." }, { status: 503 }) : adminAuthFailureResponse(error); } if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Data upload tidak dapat dibaca." }, { status: 400 }); }
  const file = form.get("file"); const weddingId = String(form.get("weddingId") || ""); const slot = String(form.get("slot") || ""); const storyId = String(form.get("storyId") || "");
  if (!(file instanceof File)) return NextResponse.json({ error: "File belum dipilih." }, { status: 400 });
  if (!/^[a-f0-9-]{36}$/i.test(weddingId)) return NextResponse.json({ error: "Undangan tujuan tidak valid." }, { status: 400 });
  if (!isMediaSlot(slot)) return NextResponse.json({ error: "Slot foto tidak dikenali." }, { status: 400 });
  if (slot === "love-story" && !/^[a-z0-9-]{1,80}$/i.test(storyId)) return NextResponse.json({ error: "Love Story tujuan tidak valid." }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "Format foto belum didukung." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Foto terlalu besar dan gagal diproses." }, { status: 400 });
  const path = slot === "love-story" ? `weddings/${weddingId}/love-story/${storyId}/${crypto.randomUUID()}.${extensions[file.type]}` : `weddings/${weddingId}/${slot}/${crypto.randomUUID()}.${extensions[file.type]}`;
  try { return NextResponse.json({ url: await supabaseCmsAdapter.upload(path, await file.arrayBuffer(), file.type) }); } catch { return NextResponse.json({ error: "Gagal terhubung ke penyimpanan." }, { status: 503 }); }
}
