import { NextResponse } from "next/server";
import { adminAuthFailureResponse, requireAdminApi } from "@/lib/admin-auth";
import { supabaseOrderAdapter } from "@/services/adapters/supabase-order-adapter";
import { orderQuerySchema } from "@/lib/order-validation";

export async function GET(request: Request) {
  let admin; try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  const query = orderQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ error: "Parameter pencarian tidak valid." }, { status: 400 });
  try { return NextResponse.json(await supabaseOrderAdapter.list(query.data), { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Pesanan belum dapat dimuat." }, { status: 503 }); }
}
