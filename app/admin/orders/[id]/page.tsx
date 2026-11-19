import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseOrderAdapter } from "@/services/adapters/supabase-order-adapter";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const order = await supabaseOrderAdapter.getById((await params).id).catch(() => null);
  if (!order) notFound();
  return <main className="mx-auto max-w-3xl p-6"><Link href="/admin/orders" className="text-sm font-semibold text-[#BF6D87]">← Semua pesanan</Link><h1 className="mt-5 font-blush-display text-4xl text-[#482C34]">{order.orderNumber}</h1><div className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-white p-6 text-sm sm:grid-cols-2"><p><strong>Nama</strong><br />{order.customerName}</p><p><strong>WhatsApp</strong><br />{order.customerWhatsapp}</p><p><strong>Email</strong><br />{order.customerEmail || "-"}</p><p><strong>Tema</strong><br />{order.packageCode}</p><p><strong>Tanggal acara</strong><br />{order.weddingDate || "-"}</p><p><strong>Status pembayaran</strong><br />{order.paymentStatus}</p><p className="sm:col-span-2"><strong>Catatan</strong><br />{order.customerNotes || "-"}</p></div><OrderStatusForm id={order.id} current={order.orderStatus} /><p className="mt-6 text-sm text-black/60">Payment verification belum termasuk fase ini.</p></main>;
}
