import { NextResponse } from "next/server";
import { wishSchema, isHumanTiming } from "@/lib/wedding-validation";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { supabaseWeddingAdapter, SupabaseUnavailableError } from "@/services/adapters/supabase-wedding-adapter";
import { getPublishedWedding } from "@/services/cms-wedding-service";
import { moderateWish } from "@/lib/wish-moderation";
import { createHash } from "node:crypto";
export async function GET(request: Request) { try { const url = new URL(request.url); const weddingSlug = url.searchParams.get("weddingSlug") || ""; const config = await getPublishedWedding(weddingSlug); if (!config) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); const page = Math.max(1, Math.min(1000, Number(url.searchParams.get("page")) || 1)); const limit = Math.max(1, Math.min(config.wishes.pageSize, Number(url.searchParams.get("limit")) || config.wishes.pageSize)); return NextResponse.json(await supabaseWeddingAdapter.listWishes(weddingSlug, page, limit)); } catch (error) { return NextResponse.json({ error: error instanceof SupabaseUnavailableError ? "Layanan ucapan belum dikonfigurasi." : "Ucapan belum dapat dimuat." }, { status: 503 }); } }
export async function POST(request: Request) {
  try {
    const rawIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const ipSecret = process.env.RATE_LIMIT_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "development-only";
    const ipHash = createHash("sha256").update(`${ipSecret}:${rawIp}`).digest("hex");
    if ((await allowSharedRequest("wish", ipHash, 6, 600)) === "blocked") return NextResponse.json({ error: "Terlalu banyak percobaan. Silakan tunggu sebentar." }, { status: 429 });
    const parsed = wishSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Ucapan tidak valid." }, { status: 400 });
    const config = await getPublishedWedding(parsed.data.weddingSlug);
    if (!config) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    if (!isHumanTiming(parsed.data.startedAt, config.wishes.minSubmitMs)) return NextResponse.json({ error: "Silakan tunggu sejenak sebelum mengirim." }, { status: 400 });
    const moderation = moderateWish(parsed.data.name, parsed.data.message);
    if (moderation.decision !== "ALLOW") return NextResponse.json({ error: moderation.decision === "SPAM" ? "Ucapan terindikasi spam. Silakan periksa kembali isi ucapan Anda." : "Ucapan tidak dapat dikirim karena mengandung kata atau konten yang tidak diperbolehkan. Silakan perbaiki ucapan Anda." }, { status: 422 });
    if (await supabaseWeddingAdapter.hasRecentDuplicateWish(parsed.data.weddingSlug, parsed.data.name, parsed.data.message)) return NextResponse.json({ error: "Ucapan yang sama baru saja dikirim. Silakan tunggu sebelum mengirim kembali." }, { status: 409 });
    return NextResponse.json(await supabaseWeddingAdapter.submitWish(parsed.data.weddingSlug, { name: parsed.data.name, message: parsed.data.message, submissionId: parsed.data.submissionId, startedAt: parsed.data.startedAt }));
  } catch (error) {
    const unavailable = error instanceof SupabaseUnavailableError;
    return NextResponse.json({ error: unavailable ? "Layanan ucapan belum dikonfigurasi." : "Ucapan belum dapat disimpan." }, { status: unavailable ? 503 : 400 });
  }
}
