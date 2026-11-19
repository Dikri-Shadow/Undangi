import "server-only";
import { CmsUnavailableError, getSupabaseAdminEnv, getSupabasePublicEnv } from "@/lib/supabase-env";
import type { WeddingConfig } from "@/types/wedding";
import type { WeddingRecord, WeddingStatus } from "@/types/cms";
import { normalizeWeddingConfig } from "@/lib/admin-workflow";

type Row = { id: string; slug: string; status: WeddingStatus; bride_name: string; bride_full_name: string; groom_name: string; groom_full_name: string; wedding_data: WeddingConfig; theme: string; created_at: string; updated_at: string; published_at: string | null; deleted_at: string | null; updated_by: string | null };
const mapRow = (row: Row): WeddingRecord => ({ id: row.id, slug: row.slug, status: row.status, brideName: row.bride_name, brideFullName: row.bride_full_name, groomName: row.groom_name, groomFullName: row.groom_full_name, weddingData: normalizeWeddingConfig(row.wedding_data), theme: row.theme, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at, deletedAt: row.deleted_at, updatedBy: row.updated_by });

async function request<T>(path: string, init: RequestInit = {}, admin = false): Promise<T> {
  const env = admin ? getSupabaseAdminEnv() : getSupabasePublicEnv();
  if (!env) throw new CmsUnavailableError();
  const key = admin ? (env as ReturnType<typeof getSupabaseAdminEnv>)!.serviceRoleKey : env.anonKey;
  const response = await fetch(`${env.url}${path}`, { ...init, cache: "no-store", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers } });
  if (!response.ok) throw new Error(`Supabase CMS request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const supabaseCmsAdapter = {
  async getPublishedBySlug(slug: string) { const rows = await request<Array<{ wedding_data: WeddingConfig }>>(`/rest/v1/weddings?slug=eq.${encodeURIComponent(slug)}&status=eq.published&deleted_at=is.null&select=wedding_data&limit=1`); return rows[0]?.wedding_data ?? null; },
  async list() { return (await request<Row[]>("/rest/v1/weddings?deleted_at=is.null&select=*&order=updated_at.desc", {}, true)).map(mapRow); },
  async listTrash() { return (await request<Row[]>("/rest/v1/weddings?deleted_at=not.is.null&select=*&order=deleted_at.desc", {}, true)).map(mapRow); },
  async getById(id: string) { const rows = await request<Row[]>(`/rest/v1/weddings?id=eq.${encodeURIComponent(id)}&deleted_at=is.null&select=*&limit=1`, {}, true); return rows[0] ? mapRow(rows[0]) : null; },
  async getDeletedById(id: string) { const rows = await request<Row[]>(`/rest/v1/weddings?id=eq.${encodeURIComponent(id)}&deleted_at=not.is.null&select=*&limit=1`, {}, true); return rows[0] ? mapRow(rows[0]) : null; },
  async create(config: WeddingConfig, updatedBy: string) {
    const body = { slug: config.slug, status: "draft", bride_name: config.bride.shortName || config.bride.fullName, bride_full_name: config.bride.fullName, groom_name: config.groom.shortName || config.groom.fullName, groom_full_name: config.groom.fullName, wedding_data: config, theme: "luxury-burgundy", updated_by: updatedBy };
    const rows = await request<Row[]>("/rest/v1/weddings?select=*", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) }, true); return mapRow(rows[0]);
  },
  async update(id: string, config: WeddingConfig, status: WeddingStatus, updatedBy: string) {
    const body = { slug: config.slug, status, bride_name: config.bride.shortName || config.bride.fullName, bride_full_name: config.bride.fullName, groom_name: config.groom.shortName || config.groom.fullName, groom_full_name: config.groom.fullName, wedding_data: config, updated_by: updatedBy, updated_at: new Date().toISOString(), published_at: status === "published" ? new Date().toISOString() : null };
    const rows = await request<Row[]>(`/rest/v1/weddings?id=eq.${encodeURIComponent(id)}&select=*`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) }, true); return rows[0] ? mapRow(rows[0]) : null;
  },
  async softDelete(id: string, updatedBy: string) { const rows = await request<Row[]>(`/rest/v1/weddings?id=eq.${encodeURIComponent(id)}&deleted_at=is.null&select=*`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ deleted_at: new Date().toISOString(), updated_by: updatedBy, updated_at: new Date().toISOString() }) }, true); return rows[0] ? mapRow(rows[0]) : null; },
  async restore(id: string, updatedBy: string) { const rows = await request<Row[]>(`/rest/v1/weddings?id=eq.${encodeURIComponent(id)}&deleted_at=not.is.null&select=*`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ deleted_at: null, updated_by: updatedBy, updated_at: new Date().toISOString() }) }, true); return rows[0] ? mapRow(rows[0]) : null; },
  async upload(path: string, file: ArrayBuffer, contentType: string) {
    const env = getSupabaseAdminEnv(); if (!env) throw new CmsUnavailableError();
    const response = await fetch(`${env.url}/storage/v1/object/wedding-media/${path}`, { method: "POST", headers: { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}`, "Content-Type": contentType, "x-upsert": "true" }, body: file });
    if (!response.ok) throw new Error(`Upload failed (${response.status})`);
    return `${env.url}/storage/v1/object/public/wedding-media/${path}`;
  },
};
