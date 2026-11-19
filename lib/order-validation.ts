import { z } from "zod";

export const orderStatusSchema = z.enum(["new", "in_progress", "waiting_customer", "completed", "cancelled"]);
export const paymentStatusSchema = z.enum(["unpaid", "proof_submitted", "verified", "rejected"]);

// customerName opsional sejak form order disederhanakan (rekomendasi 4:
// hanya jenis acara, WA, tanggal acara + tema). Bila tidak diisi, route
// mengisi nama tampilan "Pemesan via WA <nomor>" — admin menanyakan nama
// asli lewat WhatsApp. Nama tetap dibatasi 120 karakter bila diisi.
export const createOrderSchema = z.object({
  customerName: z.string().trim().max(120).optional().or(z.literal("")),
  customerWhatsapp: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,30}$/, "Nomor WhatsApp tidak valid."),
  customerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  packageCode: z.string().trim().min(1).max(80),
  themeId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  discountCode: z.string().trim().max(80).optional(),
  weddingDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  customerNotes: z.string().trim().max(2000).optional(),
});

export const updateOrderSchema = z.object({ orderStatus: orderStatusSchema });
export const setOrderPriceSchema = z.object({ totalAmount: z.coerce.number().int().positive().max(9_000_000_000), currency: z.string().trim().length(3).default("IDR") });
export const createPaymentSchema = z.object({ amount: z.coerce.number().int().positive().max(9_000_000_000), paymentMethod: z.string().trim().min(1).max(80), paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), adminNote: z.string().trim().max(2000).optional() });
export const paymentReportQuerySchema = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });
export const orderQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  orderStatus: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const transitions: Record<z.infer<typeof orderStatusSchema>, readonly z.infer<typeof orderStatusSchema>[]> = {
  new: ["in_progress", "cancelled"],
  in_progress: ["waiting_customer", "completed", "cancelled"],
  waiting_customer: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isOrderStatusTransitionAllowed(from: z.infer<typeof orderStatusSchema>, to: z.infer<typeof orderStatusSchema>) {
  return from === to || transitions[from].includes(to);
}
