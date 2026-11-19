import "server-only";
import { getSupabaseAdminEnv } from "@/lib/supabase-env";

export type OrderStatus = "new" | "in_progress" | "waiting_customer" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partially_paid" | "proof_submitted" | "verified" | "rejected" | "paid";
export type PaymentTransaction = { id: string; orderId: string; amount: number; paymentMethod: string; paymentDate: string; verificationStatus: "pending" | "verified" | "rejected"; verifiedAt: string | null; verifiedBy: string | null; adminNote: string | null };
export type Order = { id: string; orderNumber: string; customerName: string; customerWhatsapp: string; customerEmail: string | null; packageCode: string; weddingDate: string | null; customerNotes: string | null; orderStatus: OrderStatus; paymentStatus: PaymentStatus; weddingId: string | null; totalAmount: number | null; currency: string; catalogSnapshot: unknown; createdAt: string; updatedAt: string };
type Row = { id: string; order_number: string; customer_name: string; customer_whatsapp: string; customer_email: string | null; package_code: string; wedding_date: string | null; customer_notes: string | null; order_status: OrderStatus; payment_status: PaymentStatus; wedding_id: string | null; total_amount: number | null; currency: string; catalog_snapshot: unknown; created_at: string; updated_at: string };
const map = (row: Row): Order => ({ id: row.id, orderNumber: row.order_number, customerName: row.customer_name, customerWhatsapp: row.customer_whatsapp, customerEmail: row.customer_email, packageCode: row.package_code, weddingDate: row.wedding_date, customerNotes: row.customer_notes, orderStatus: row.order_status, paymentStatus: row.payment_status, weddingId: row.wedding_id, totalAmount: row.total_amount, currency: row.currency, catalogSnapshot: row.catalog_snapshot, createdAt: row.created_at, updatedAt: row.updated_at });

async function request<T>(path: string, init: RequestInit = {}) {
  const env = getSupabaseAdminEnv(); if (!env) throw new Error("Order service unavailable.");
  const response = await fetch(`${env.url}${path}`, { ...init, cache: "no-store", headers: { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}`, "Content-Type": "application/json", ...init.headers } });
  if (!response.ok) throw new Error(`Order request failed (${response.status})`);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const supabaseOrderAdapter = {
  async create(input: { customerName: string; customerWhatsapp: string; customerEmail: string | null; packageCode: string; weddingDate: string | null; customerNotes: string | null; catalogSnapshot?: unknown }) {
    const orderNumber = `UND-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const rows = await request<Row[]>("/rest/v1/orders?select=*", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ order_number: orderNumber, customer_name: input.customerName, customer_whatsapp: input.customerWhatsapp, customer_email: input.customerEmail || null, package_code: input.packageCode, wedding_date: input.weddingDate || null, customer_notes: input.customerNotes || null, ...(input.catalogSnapshot ? { catalog_snapshot: input.catalogSnapshot, pricing_calculated_at: new Date().toISOString() } : {}) }) });
    return map(rows[0]);
  },
  async list(options: { q?: string; orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; page?: number; pageSize?: number } = {}) {
    const page = options.page || 1; const pageSize = options.pageSize || 20; const filters = new URLSearchParams({ select: "*", order: "created_at.desc", limit: String(pageSize), offset: String((page - 1) * pageSize) });
    if (options.q) { const safe = options.q.replaceAll(",", "").replaceAll("%", ""); filters.set("or", `(customer_name.ilike.*${safe}*,order_number.ilike.*${safe}*)`); }
    if (options.orderStatus) filters.set("order_status", `eq.${options.orderStatus}`);
    if (options.paymentStatus) filters.set("payment_status", `eq.${options.paymentStatus}`);
    const rows = await request<Row[]>(`/rest/v1/orders?${filters.toString()}`); return { items: rows.map(map), page, pageSize };
  },
  async getById(id: string) { const rows = await request<Row[]>(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`); return rows[0] ? map(rows[0]) : null; },
  async updateStatus(id: string, orderStatus: OrderStatus) { const rows = await request<Row[]>(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=*`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ order_status: orderStatus, updated_at: new Date().toISOString() }) }); return rows[0] ? map(rows[0]) : null; },
  async setPrice(id: string, totalAmount: number, currency: string) { const rows = await request<Row[]>(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=*`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ total_amount: totalAmount, currency, updated_at: new Date().toISOString() }) }); return rows[0] ? map(rows[0]) : null; },
  async listPayments(orderId: string) { const rows = await request<Array<{ id:string; order_id:string; amount:number; payment_method:string; payment_date:string; verification_status:"pending"|"verified"|"rejected"; verified_at:string|null; verified_by:string|null; admin_note:string|null }>>(`/rest/v1/payment_transactions?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=payment_date.desc`); return rows.map((row) => ({ id: row.id, orderId: row.order_id, amount: row.amount, paymentMethod: row.payment_method, paymentDate: row.payment_date, verificationStatus: row.verification_status, verifiedAt: row.verified_at, verifiedBy: row.verified_by, adminNote: row.admin_note })); },
  async createPayment(orderId: string, input: { amount:number; paymentMethod:string; paymentDate:string; adminNote?:string }) { const rows = await request<Array<{id:string}>>(`/rest/v1/payment_transactions?select=id`, { method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify({ order_id:orderId, amount:input.amount, payment_method:input.paymentMethod, payment_date:input.paymentDate, admin_note:input.adminNote || null }) }); return rows[0]; },
  async verifyPayment(id: string, verifiedBy: string) { return request<PaymentTransaction>("/rest/v1/rpc/verify_payment_transaction", { method:"POST", body:JSON.stringify({ p_transaction_id:id, p_verified_by:verifiedBy }) }); },
  async rejectPayment(id: string, note: string) { const rows = await request<Array<{id:string}>>(`/rest/v1/payment_transactions?id=eq.${encodeURIComponent(id)}&verification_status=eq.pending&select=id`, { method:"PATCH", headers:{Prefer:"return=representation"}, body:JSON.stringify({ verification_status:"rejected", admin_note:note, updated_at:new Date().toISOString() }) }); return rows[0]; },
  async verifiedPayments(from?: string, to?: string) { const params = new URLSearchParams({ verification_status:"eq.verified", select:"id,order_id,amount,payment_date,verified_at", order:"payment_date.desc" }); if(from && to) params.set("and", `(payment_date.gte.${from},payment_date.lte.${to})`); else if(from) params.set("payment_date", `gte.${from}`); else if(to) params.set("payment_date", `lte.${to}`); return request<Array<{id:string;order_id:string;amount:number;payment_date:string;verified_at:string|null}>>(`/rest/v1/payment_transactions?${params}`); },
};
