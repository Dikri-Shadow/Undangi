import { NextResponse } from "next/server";
import { listCatalog } from "@/services/catalog-service";

export async function GET() {
  try {
    const catalog = await listCatalog();
    return NextResponse.json(catalog, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Katalog belum dapat dimuat." }, { status: 503 });
  }
}
