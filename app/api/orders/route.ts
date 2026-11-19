import { NextResponse } from "next/server";
import { allowPersistentRequest } from "@/lib/persistent-rate-limit";
import { createOrderSchema } from "@/lib/order-validation";
import { supabaseOrderAdapter } from "@/services/adapters/supabase-order-adapter";
import { resolveCatalogSnapshot, resolveThemeSnapshot } from "@/services/catalog-service";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await allowPersistentRequest("order-create", ip, 5, 3600);
  if (limited === "blocked") return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
  if (limited === "unavailable") return NextResponse.json({ error: "Pesanan belum dapat diproses." }, { status: 503 });
  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data pesanan tidak valid." }, { status: 400 });
  try {
    // Jual per tema: snapshot dari tema saja. Jalur lama (tema + paket) dipertahankan untuk kompatibilitas.
    const snapshot = parsed.data.themeId
      ? parsed.data.packageId
        ? await resolveCatalogSnapshot(parsed.data.themeId, parsed.data.packageId, parsed.data.discountCode)
        : await resolveThemeSnapshot(parsed.data.themeId, parsed.data.discountCode)
      : undefined;
    // Nama pemesan opsional di form singkat: bila kosong, simpan nama
    // tampilan dari nomor WA supaya admin tetap bisa mengenali ordernya.
    const customerName = parsed.data.customerName || `Pemesan via WA ${parsed.data.customerWhatsapp}`;
    const order = await supabaseOrderAdapter.create({ customerName, customerWhatsapp: parsed.data.customerWhatsapp, customerEmail: parsed.data.customerEmail || null, packageCode: parsed.data.packageCode, weddingDate: parsed.data.weddingDate || null, customerNotes: parsed.data.customerNotes || null, catalogSnapshot: snapshot });
    return NextResponse.json({ orderNumber: order.orderNumber, message: "Pesanan berhasil dikirim." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Pesanan belum dapat diproses." }, { status: 503 }); }
}
