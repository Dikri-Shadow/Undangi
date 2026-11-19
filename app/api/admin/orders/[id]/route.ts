import { NextResponse } from "next/server";
import { adminAuthFailureResponse, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { isOrderStatusTransitionAllowed, setOrderPriceSchema, updateOrderSchema } from "@/lib/order-validation";
import { supabaseOrderAdapter } from "@/services/adapters/supabase-order-adapter";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin; try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  try { const order = await supabaseOrderAdapter.getById((await params).id); return order ? NextResponse.json(order, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 }); } catch { return NextResponse.json({ error: "Pesanan belum dapat dimuat." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin; try { admin = await requireAdminApi(); } catch (error) { return adminAuthFailureResponse(error); }
  if (!admin) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  if (!(await isSameOrigin(request))) return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const body = await request.json().catch(() => null); if (body && typeof body === "object" && "totalAmount" in body) { const price = setOrderPriceSchema.safeParse(body); if (!price.success) return NextResponse.json({ error: "Harga pesanan tidak valid." }, { status: 400 }); try { const id = (await params).id; const current = await supabaseOrderAdapter.getById(id); if (!current) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 }); const payments = await supabaseOrderAdapter.listPayments(id); if (payments.length && current.totalAmount !== price.data.totalAmount) return NextResponse.json({ error: "Harga tidak dapat diubah setelah transaksi tercatat." }, { status: 409 }); const updated = await supabaseOrderAdapter.setPrice(id, price.data.totalAmount, price.data.currency); return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 }); } catch { return NextResponse.json({ error: "Harga pesanan belum dapat disimpan." }, { status: 503 }); } }
  const parsed = updateOrderSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Status pesanan tidak valid." }, { status: 400 });
  try {
    const id = (await params).id; const current = await supabaseOrderAdapter.getById(id); if (!current) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (parsed.data.orderStatus === "in_progress") { if (!current.totalAmount || current.totalAmount <= 0) return NextResponse.json({ error: "Tentukan harga pesanan terlebih dahulu." }, { status: 409 }); const payments = await supabaseOrderAdapter.listPayments(id); const verified = payments.filter((payment) => payment.verificationStatus === "verified").reduce((sum, payment) => sum + payment.amount, 0); const minimum = Math.ceil(current.totalAmount * 0.5); if (verified < minimum) return NextResponse.json({ error: `Pembayaran terverifikasi belum mencapai DP minimum. Kurang ${minimum - verified}.` }, { status: 409 }); }
    if (!isOrderStatusTransitionAllowed(current.orderStatus, parsed.data.orderStatus)) return NextResponse.json({ error: "Transisi status pesanan tidak valid." }, { status: 409 });
    const updated = await supabaseOrderAdapter.updateStatus(id, parsed.data.orderStatus); return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Status pesanan belum dapat diperbarui." }, { status: 503 }); }
}
