import type { ResponsivePhotoPresentation, WeddingConfig } from "@/types/wedding";

export const PHOTO_SLOTS = ["cover", "hero", "bride", "groom", "gallery", "love-story", "og", "divider", "closing"] as const;
export const MEDIA_SLOTS = [...PHOTO_SLOTS, "audio"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];
export type MediaSlotName = (typeof MEDIA_SLOTS)[number];

export const photoSlotConfig: Record<PhotoSlot, { label: string; ratio: number; width: number; height: number }> = {
  cover: { label: "Foto Cover", ratio: 4 / 5, width: 1440, height: 1800 },
  hero: { label: "Foto Hero", ratio: 4 / 5, width: 1440, height: 1800 },
  bride: { label: "Foto Mempelai Wanita", ratio: 4 / 5, width: 1200, height: 1500 },
  groom: { label: "Foto Mempelai Pria", ratio: 4 / 5, width: 1200, height: 1500 },
  divider: { label: "Foto Divider", ratio: 16 / 9, width: 1920, height: 1080 },
  closing: { label: "Foto Closing", ratio: 4 / 5, width: 1440, height: 1800 },
  og: { label: "OG Image", ratio: 1200 / 630, width: 1200, height: 630 },
  gallery: { label: "Foto Gallery", ratio: 4 / 5, width: 1200, height: 1500 },
  "love-story": { label: "Foto Love Story", ratio: 16 / 9, width: 1600, height: 900 },
};

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif";
const supportedInputTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"]);

export function isPhotoSlot(value: string): value is PhotoSlot {
  return (PHOTO_SLOTS as readonly string[]).includes(value);
}

export function isMediaSlot(value: string): value is MediaSlotName {
  return (MEDIA_SLOTS as readonly string[]).includes(value);
}

export function isAcceptedImage(file: Pick<File, "name" | "type">) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return supportedInputTypes.has(file.type.toLowerCase()) || ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"].includes(extension || "");
}

export function imageReadError(file: Pick<File, "name" | "type">) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "heic" || extension === "heif" || /hei[cf]/i.test(file.type)) {
    return "Format HEIC/HEIF belum dapat diproses oleh browser ini. Pilih versi JPEG dari foto tersebut.";
  }
  return "File foto tidak dapat dibaca.";
}

export function outputFileName(slot: PhotoSlot) {
  return `${slot}-${Date.now()}.webp`;
}

export const defaultPhotoTransform = { zoom: 1, rotation: 0, x: 0, y: 0 } as const;
export function clampPhotoZoom(value: number) { return Math.min(4, Math.max(1, value)); }
export function rotatePhoto(value: number) { return (value + 90) % 360; }
export function movePhoto(value: { x: number; y: number }, dx: number, dy: number) {
  return { x: Math.max(-1, Math.min(1, value.x + dx)), y: Math.max(-1, Math.min(1, value.y + dy)) };
}

export function applyMediaToConfig(config: WeddingConfig, slot: MediaSlotName, url: string, galleryIndex?: number, storyIndex?: number) {
  if (slot === "cover") config.assets.cover = url;
  if (slot === "hero") config.assets.hero = url;
  if (slot === "bride") { config.bride.image = url; config.assets.brideProfile = url; }
  if (slot === "groom") { config.groom.image = url; config.assets.groomProfile = url; }
  if (slot === "divider") config.assets.divider = url;
  if (slot === "closing") config.assets.closing = url;
  if (slot === "og") config.assets.ogImage = url;
  if (slot === "audio") config.music.src = url;
  if (slot === "gallery") {
    const next = { src: url, alt: `Foto ${config.couple.display}`, presentation: galleryIndex === undefined ? undefined : config.gallery[galleryIndex]?.presentation };
    if (galleryIndex === undefined) config.gallery.push(next); else config.gallery[galleryIndex] = next;
  }
  if (slot === "love-story" && storyIndex !== undefined && config.loveStory[storyIndex]) config.loveStory[storyIndex].image = url;
}

export function applyPresentationToConfig(config: WeddingConfig, slot: PhotoSlot, presentation: ResponsivePhotoPresentation, galleryIndex?: number) {
  if (slot === "gallery" && galleryIndex !== undefined && config.gallery[galleryIndex]) { config.gallery[galleryIndex].presentation = presentation; return; }
  if (["cover", "hero", "bride", "groom", "divider", "closing", "og"].includes(slot)) {
    config.mediaPresentation = { ...config.mediaPresentation, [slot]: presentation };
  }
}
