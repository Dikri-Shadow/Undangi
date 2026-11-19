import { NextResponse } from "next/server";
import { rsvpSchemaForMaxGuests, isHumanTiming } from "@/lib/wedding-validation";
import { allowSharedRequest } from "@/lib/persistent-rate-limit";
import { supabaseWeddingAdapter, SupabaseUnavailableError } from "@/services/adapters/supabase-wedding-adapter";
import { getPublishedWedding } from "@/services/cms-wedding-service";
import { findRecipientByName } from "@/services/admin-guest-access-service";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if ((await allowSharedRequest("rsvp", ip, 8, 600)) === "blocked") return NextResponse.json({ error: "Terlalu banyak percobaan. Silakan tunggu sebentar." }, { status: 429 });
    const raw = await request.json() as Record<string, unknown>;
    const slug = typeof raw?.weddingSlug === "string" ? raw.weddingSlug : "";
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    const config = await getPublishedWedding(slug); if (!config) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    const parsed = rsvpSchemaForMaxGuests(config.rsvp?.maxGuests ?? 4).safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Data RSVP tidak valid." }, { status: 400 });
    if (!isHumanTiming(parsed.data.startedAt, config.rsvp.minSubmitMs)) return NextResponse.json({ error: "Silakan periksa kembali data Anda." }, { status: 400 });
    // Link tamu cukup ?to=Nama — tanpa token. Nama dari body (sudah
    // divalidasi skema) dicocokkan ke daftar tamu supaya RSVP tercatat
    // di recipient yang benar; bila nama tidak ada di daftar tamu,
    // RSVP tetap tercatat sebagai baris legacy (tanpa recipient_id).
    const recipient = await findRecipientByName(slug, parsed.data.name).catch(() => null);
    await supabaseWeddingAdapter.submitRsvp(parsed.data.weddingSlug, { name: parsed.data.name, recipientId: recipient?.id, attendance: parsed.data.attendance, guests: parsed.data.guests, message: parsed.data.message, submissionId: parsed.data.submissionId, startedAt: parsed.data.startedAt });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof SupabaseUnavailableError ? "Layanan RSVP belum dikonfigurasi." : "Konfirmasi belum dapat disimpan." }, { status: 503 }); }
}
