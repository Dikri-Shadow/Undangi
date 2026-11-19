import type { RsvpPayload, Wish, WishPayload } from "@/types/wedding";

export interface WeddingDataService {
  submitRsvp(weddingSlug: string, payload: RsvpPayload): Promise<void>;
  listWishes(weddingSlug: string, page: number, limit: number): Promise<{ items: Wish[]; hasMore: boolean }>;
  submitWish(weddingSlug: string, payload: WishPayload): Promise<Wish>;
}

class MockWeddingService implements WeddingDataService {
  private wishes: Wish[] = [];
  private requestIds = new Set<string>();
  async submitRsvp(_slug: string, payload: RsvpPayload) { await new Promise((resolve) => setTimeout(resolve, 450)); if (this.requestIds.has(payload.submissionId)) return; this.requestIds.add(payload.submissionId); }
  async listWishes(_slug: string, page: number, limit: number) { await new Promise((resolve) => setTimeout(resolve, 180)); const offset = (page - 1) * limit; return { items: this.wishes.slice(offset, offset + limit), hasMore: offset + limit < this.wishes.length }; }
  async submitWish(_slug: string, payload: WishPayload) { await new Promise((resolve) => setTimeout(resolve, 350)); if (this.requestIds.has(payload.submissionId)) throw new Error("Ucapan sudah terkirim"); this.requestIds.add(payload.submissionId); const wish = { id: crypto.randomUUID(), name: payload.name, message: payload.message, date: new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date()) }; this.wishes.unshift(wish); return wish; }
}

class ApiWeddingService implements WeddingDataService {
  private async json<T>(url: string, init?: RequestInit): Promise<T> { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 9000); try { const response = await fetch(url, { ...init, signal: controller.signal, headers: { "Content-Type": "application/json", ...init?.headers } }); const data = await response.json().catch(() => ({})) as T & { error?: string }; if (!response.ok) throw new Error(data.error || "Layanan sementara tidak tersedia"); return data; } finally { clearTimeout(timeout); } }
  async submitRsvp(weddingSlug: string, payload: RsvpPayload) { await this.json("/api/wedding/rsvp", { method: "POST", body: JSON.stringify({ weddingSlug, ...payload }) }); }
  async listWishes(weddingSlug: string, page: number, limit: number) { return this.json<{ items: Wish[]; hasMore: boolean }>(`/api/wedding/wishes?weddingSlug=${encodeURIComponent(weddingSlug)}&page=${page}&limit=${limit}`); }
  async submitWish(weddingSlug: string, payload: WishPayload) { return this.json<Wish>("/api/wedding/wishes", { method: "POST", body: JSON.stringify({ weddingSlug, ...payload }) }); }
}

export const weddingService: WeddingDataService = process.env.NEXT_PUBLIC_WEDDING_DATA_ADAPTER === "supabase" ? new ApiWeddingService() : new MockWeddingService();
