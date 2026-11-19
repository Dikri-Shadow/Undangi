import "server-only";
import { CmsUnavailableError, getSupabaseAdminEnv } from "@/lib/supabase-env";
import type { AdminRsvpRecord } from "@/types/cms";

type RsvpRow = {
  id: string;
  wedding_slug: string;
  guest_name: string;
  attendance: "hadir" | "tidak";
  guest_count: number;
  message: string | null;
  created_at: string;
};

export type AdminRecipientSummary = { id: string; guestName: string; createdAt: string; rsvp: AdminRsvpRecord | null };

export async function listAdminRsvp(): Promise<AdminRsvpRecord[]> {
  const env = getSupabaseAdminEnv();
  if (!env) throw new CmsUnavailableError();
  const fields = "id,wedding_slug,guest_name,attendance,guest_count,message,created_at";
  const response = await fetch(`${env.url}/rest/v1/wedding_rsvp?select=${fields}&order=created_at.desc&limit=1000`, {
    cache: "no-store",
    headers: { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}` },
  });
  if (!response.ok) throw new Error(`RSVP admin request failed (${response.status})`);
  const rows = await response.json() as RsvpRow[];
  return rows.map((row) => ({ id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, attendance: row.attendance, guestCount: row.guest_count, message: row.message, createdAt: row.created_at }));
}

export async function listAdminRsvpForWedding(weddingSlug: string): Promise<AdminRsvpRecord[]> {
  const env = getSupabaseAdminEnv();
  if (!env) throw new CmsUnavailableError();
  const fields = "id,wedding_slug,guest_name,attendance,guest_count,message,created_at";
  const response = await fetch(`${env.url}/rest/v1/wedding_rsvp?select=${fields}&wedding_slug=eq.${encodeURIComponent(weddingSlug)}&order=created_at.desc&limit=1000`, { cache: "no-store", headers: { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}` } });
  if (!response.ok) throw new Error(`RSVP admin request failed (${response.status})`);
  const rows = await response.json() as RsvpRow[];
  return rows.map((row) => ({ id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, attendance: row.attendance, guestCount: row.guest_count, message: row.message, createdAt: row.created_at }));
}

export async function listAdminRecipientsForWedding(weddingSlug: string): Promise<AdminRecipientSummary[]> {
  const env = getSupabaseAdminEnv();
  if (!env) throw new CmsUnavailableError();
  const headers = { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}` };
  const base = `${env.url}/rest/v1/`;
  const [recipientsResponse, rsvpResponse] = await Promise.all([
    fetch(`${base}wedding_recipients?select=id,guest_name,created_at&wedding_slug=eq.${encodeURIComponent(weddingSlug)}&deleted_at=is.null&order=created_at.asc`, { headers, cache: "no-store" }),
    fetch(`${base}wedding_rsvp?select=id,wedding_slug,guest_name,attendance,guest_count,message,created_at,recipient_id&wedding_slug=eq.${encodeURIComponent(weddingSlug)}&order=created_at.desc&limit=1000`, { headers, cache: "no-store" }),
  ]);
  if (!recipientsResponse.ok || !rsvpResponse.ok) throw new Error("Data tamu belum dapat dimuat.");
  const recipients = await recipientsResponse.json() as Array<{ id: string; guest_name: string; created_at: string }>;
  const rsvps = await rsvpResponse.json() as Array<RsvpRow & { recipient_id: string | null }>;
  const byRecipient = new Map<string, AdminRsvpRecord>();
  for (const row of rsvps) if (row.recipient_id && !byRecipient.has(row.recipient_id)) byRecipient.set(row.recipient_id, { id: row.id, weddingSlug: row.wedding_slug, guestName: row.guest_name, attendance: row.attendance, guestCount: row.guest_count, message: row.message, createdAt: row.created_at });
  return recipients.map((row) => ({ id: row.id, guestName: row.guest_name, createdAt: row.created_at, rsvp: byRecipient.get(row.id) ?? null }));
}
