import type { WeddingStatus } from "@/types/cms";
import type { WeddingConfig } from "@/types/wedding";

export type CompletenessItem = { id: string; label: string; level: "required" | "recommended" | "optional"; complete: boolean };
export type LocalWeddingDraft = { version: 1; invitationId: string; savedAt: string; status: WeddingStatus; weddingData: WeddingConfig };

const filled = (value?: string | null) => Boolean(value?.trim());

/** Keeps malformed CMS rows from taking down admin pages without inventing business data. */
export function normalizeWeddingConfig(value: unknown): WeddingConfig {
  const source = (value && typeof value === "object" ? value : {}) as Partial<WeddingConfig>;
  const bride = (source.bride && typeof source.bride === "object" ? source.bride : {}) as Partial<WeddingConfig["bride"]>;
  const groom = (source.groom && typeof source.groom === "object" ? source.groom : {}) as Partial<WeddingConfig["groom"]>;
  const couple = (source.couple && typeof source.couple === "object" ? source.couple : {}) as Partial<WeddingConfig["couple"]>;
  const assets = (source.assets && typeof source.assets === "object" ? source.assets : {}) as Partial<WeddingConfig["assets"]>;
  const metadata = (source.metadata && typeof source.metadata === "object" ? source.metadata : {}) as Partial<WeddingConfig["metadata"]>;
  const gift = (source.gift && typeof source.gift === "object" ? source.gift : {}) as Partial<WeddingConfig["gift"]>;
  const music = (source.music && typeof source.music === "object" ? source.music : {}) as Partial<WeddingConfig["music"]>;
  return {
    ...source as WeddingConfig,
    couple: { first: typeof couple.first === "string" ? couple.first : "", second: typeof couple.second === "string" ? couple.second : "", display: typeof couple.display === "string" ? couple.display : "" },
    bride: { ...bride, fullName: typeof bride.fullName === "string" ? bride.fullName : "", shortName: typeof bride.shortName === "string" ? bride.shortName : "", parents: typeof bride.parents === "string" ? bride.parents : "", image: typeof bride.image === "string" ? bride.image : "" },
    groom: { ...groom, fullName: typeof groom.fullName === "string" ? groom.fullName : "", shortName: typeof groom.shortName === "string" ? groom.shortName : "", parents: typeof groom.parents === "string" ? groom.parents : "", image: typeof groom.image === "string" ? groom.image : "" },
    events: Array.isArray(source.events) ? source.events.filter((item): item is WeddingConfig["events"][number] => Boolean(item && typeof item === "object")) : [],
    loveStory: Array.isArray(source.loveStory) ? source.loveStory.filter((item): item is WeddingConfig["loveStory"][number] => Boolean(item && typeof item === "object")) : [],
    gallery: Array.isArray(source.gallery) ? source.gallery.filter((item): item is WeddingConfig["gallery"][number] => Boolean(item && typeof item === "object")) : [],
    assets: { ...assets, cover: typeof assets.cover === "string" ? assets.cover : "", hero: typeof assets.hero === "string" ? assets.hero : "" },
    gift: { ...gift, enabled: gift.enabled === true, accounts: Array.isArray(gift.accounts) ? gift.accounts : [] },
    music: { ...music, enabled: music.enabled === true, src: typeof music.src === "string" ? music.src : "" },
    metadata: { ...metadata, title: typeof metadata.title === "string" ? metadata.title : "" },
  } as WeddingConfig;
}

export function calculateCompleteness(config: WeddingConfig) {
  const safe = normalizeWeddingConfig(config);
  const source = (config && typeof config === "object" ? config : {}) as Partial<WeddingConfig>;
  const eventsReady = safe.events.length >= 2 && safe.events.every((event) => filled(event.date) && filled(event.venue));
  const items: CompletenessItem[] = [
    { id: "identity", label: "Identitas", level: "required", complete: filled(safe.bride.fullName) && filled(safe.groom.fullName) },
    { id: "events", label: "Acara", level: "required", complete: eventsReady },
    { id: "location", label: "Lokasi", level: "required", complete: safe.events.length > 0 && safe.events.every((event) => filled(event.address) || filled(event.mapsUrl)) },
    { id: "main-media", label: "Media utama", level: "recommended", complete: filled(safe.assets.cover) && filled(safe.assets.hero) },
    { id: "profiles", label: "Profil mempelai", level: "recommended", complete: filled(safe.bride.image) && filled(safe.groom.image) },
    { id: "love-story", label: "Love Story", level: "optional", complete: safe.loveStory.some((item) => filled(item.title) && filled(item.description)) },
    { id: "gallery", label: "Galeri", level: "optional", complete: safe.gallery.length > 0 },
    { id: "gift", label: "Gift", level: "optional", complete: Boolean(source.gift) && (!safe.gift.enabled || safe.gift.accounts.length > 0) },
    { id: "music", label: "Musik", level: "optional", complete: Boolean(source.music) && (!safe.music.enabled || filled(safe.music.src)) },
    { id: "metadata", label: "SEO & Link", level: "recommended", complete: Boolean(source.metadata) && filled(safe.slug) && filled(safe.metadata.title) },
  ];
  const completed = items.filter((item) => item.complete).length;
  return { items, completed, total: items.length, percent: Math.round((completed / items.length) * 100), missing: items.filter((item) => !item.complete) };
}

export const localDraftKey = (invitationId: string) => `undangi:admin-draft:v1:${invitationId}`;

export function serializeLocalDraft(invitationId: string, status: WeddingStatus, weddingData: WeddingConfig, savedAt = new Date().toISOString()) {
  return JSON.stringify({ version: 1, invitationId, savedAt, status, weddingData } satisfies LocalWeddingDraft);
}

export function parseLocalDraft(value: string | null, invitationId: string): LocalWeddingDraft | null {
  if (!value) return null;
  try {
    const draft = JSON.parse(value) as Partial<LocalWeddingDraft>;
    return draft.version === 1 && draft.invitationId === invitationId && typeof draft.savedAt === "string" && (draft.status === "draft" || draft.status === "published") && Boolean(draft.weddingData) ? draft as LocalWeddingDraft : null;
  } catch { return null; }
}
