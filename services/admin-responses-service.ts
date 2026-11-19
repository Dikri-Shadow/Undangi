import "server-only";
import { CmsUnavailableError, getSupabaseAdminEnv } from "@/lib/supabase-env";
import type { AdminRsvpRecord, AdminWishRecord } from "@/types/cms";

async function adminRequest(path: string, init: RequestInit = {}) {
  const env = getSupabaseAdminEnv(); if (!env) throw new CmsUnavailableError();
  return fetch(`${env.url}/rest/v1/${path}`, { ...init, cache: "no-store", headers: { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}`, ...init.headers } });
}

export async function getAdminResponseCounts(weddingSlug?: string | string[]) {
  const filter = Array.isArray(weddingSlug)
    ? weddingSlug.length ? `&wedding_slug=in.(${weddingSlug.map((slug) => encodeURIComponent(slug)).join(",")})` : "&wedding_slug=in.(null)"
    : weddingSlug ? `&wedding_slug=eq.${encodeURIComponent(weddingSlug)}` : "";
  const [rsvp, wishes] = await Promise.all([
    adminRequest(`wedding_rsvp?select=id${filter}`, { method: "HEAD", headers: { Prefer: "count=exact" } }),
    adminRequest(`wedding_wishes?select=id${filter}`, { method: "HEAD", headers: { Prefer: "count=exact" } }),
  ]);
  if (!rsvp.ok || !wishes.ok) throw new Error("Jumlah respons belum dapat dimuat.");
  const count = (response: Response) => Number(response.headers.get("content-range")?.split("/")[1] || 0);
  return { rsvp: count(rsvp), wishes: count(wishes) };
}

export async function listAdminRsvpForWedding(weddingSlug: string): Promise<AdminRsvpRecord[]> {
  const fields = "id,wedding_slug,guest_name,attendance,guest_count,message,created_at";
  const response = await adminRequest(`wedding_rsvp?select=${fields}&wedding_slug=eq.${encodeURIComponent(weddingSlug)}&order=created_at.desc&limit=1000`);
  if (!response.ok) throw new Error("RSVP belum dapat dimuat.");
  const rows = await response.json() as Array<{ id: string; wedding_slug: string; guest_name: string; attendance: "hadir" | "tidak"; guest_count: number; message: string | null; created_at: string }>;
  return rows.map((row) => ({ id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, attendance: row.attendance, guestCount: row.guest_count, message: row.message, createdAt: row.created_at }));
}

export async function listAdminWishesForWedding(weddingSlug: string): Promise<AdminWishRecord[]> {
  const fields = "id,wedding_slug,guest_name,message,created_at,moderation_status";
  const response = await adminRequest(`wedding_wishes?select=${fields}&wedding_slug=eq.${encodeURIComponent(weddingSlug)}&order=created_at.desc&limit=1000`);
  if (!response.ok) throw new Error("Ucapan belum dapat dimuat.");
  const rows = await response.json() as Array<{ id: string; wedding_slug: string; guest_name: string; message: string; created_at: string; moderation_status?: "pending" | "approved" | "rejected" }>;
  return rows.map((row) => ({ id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, message: row.message, createdAt: row.created_at, moderationStatus: row.moderation_status ?? "approved" }));
}

export async function listAdminWishes(): Promise<AdminWishRecord[]> {
  const fields = "id,wedding_slug,guest_name,message,created_at,moderation_status";
  const response = await adminRequest(`wedding_wishes?select=${fields}&order=created_at.desc&limit=1000`);
  if (!response.ok) throw new Error("Ucapan belum dapat dimuat.");
  const rows = await response.json() as Array<{ id: string; wedding_slug: string; guest_name: string; message: string; created_at: string; moderation_status?: "pending" | "approved" | "rejected" }>;
  return rows.map((row) => ({ id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, message: row.message, createdAt: row.created_at, moderationStatus: row.moderation_status ?? "approved" }));
}

export async function listAdminPendingWishes(): Promise<AdminWishRecord[]> {
  const fields = "id,wedding_slug,guest_name,message,created_at,moderation_status";
  const response = await adminRequest(`wedding_wishes?select=${fields}&moderation_status=eq.pending&order=created_at.desc&limit=50`);
  if (!response.ok) throw new Error("Ucapan pending belum dapat dimuat.");
  const rows = await response.json() as Array<{ id: string; wedding_slug: string; guest_name: string; message: string; created_at: string; moderation_status?: "pending" | "approved" | "rejected" }>;
  return rows.map((row) => ({ id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, message: row.message, createdAt: row.created_at, moderationStatus: row.moderation_status ?? "pending" }));
}

export async function updateAdminWishStatus(id: string, weddingSlug: string, status: "approved" | "rejected") {
  const response = await adminRequest(`wedding_wishes?id=eq.${encodeURIComponent(id)}&wedding_slug=eq.${encodeURIComponent(weddingSlug)}`, { method: "PATCH", headers: { Prefer: "return=minimal", "Content-Type": "application/json" }, body: JSON.stringify({ moderation_status: status, approved: status === "approved" }) });
  if (!response.ok) throw new Error("Status ucapan belum dapat diperbarui.");
}

export async function deleteAdminWish(id: string, weddingSlug: string) {
  const response = await adminRequest(`wedding_wishes?id=eq.${encodeURIComponent(id)}&wedding_slug=eq.${encodeURIComponent(weddingSlug)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  if (!response.ok) throw new Error("Ucapan belum dapat dihapus.");
}
