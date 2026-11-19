import type { PhotoPresentation, ResponsivePhotoPresentation, WeddingConfig } from "@/types/wedding";

export type PresentationSlot = "cover" | "hero" | "bride" | "groom" | "divider" | "closing" | "og" | "gallery" | "love-story";
export type PresentationDevice = "mobile" | "desktop";

export const defaultPresentation: PhotoPresentation = { zoom: 1, rotation: 0, x: 0, y: 0 };

export const presentationRatios: Record<PresentationSlot, Record<PresentationDevice, number>> = {
  cover: { mobile: 390 / 844, desktop: 1366 / 768 },
  hero: { mobile: 390 / 844, desktop: 1366 / 768 },
  bride: { mobile: 4 / 5, desktop: 4 / 5 },
  groom: { mobile: 4 / 5, desktop: 4 / 5 },
  // These ratios are also used by the public Divider container. Keeping the
  // contract here prevents the editor canvas and renderer from drifting.
  divider: { mobile: 390 / 620, desktop: 16 / 7 },
  closing: { mobile: 390 / 844, desktop: 1366 / 768 },
  og: { mobile: 1200 / 630, desktop: 1200 / 630 },
  gallery: { mobile: 4 / 5, desktop: 4 / 5 },
  "love-story": { mobile: 16 / 10, desktop: 16 / 10 },
};

export function normalizePresentation(value?: Partial<PhotoPresentation>): PhotoPresentation {
  return {
    zoom: Math.min(4, Math.max(1, value?.zoom ?? 1)),
    rotation: ((value?.rotation ?? 0) % 360 + 360) % 360,
    x: Math.min(1, Math.max(-1, value?.x ?? 0)),
    y: Math.min(1, Math.max(-1, value?.y ?? 0)),
  };
}

export function presentationFor(presentation: ResponsivePhotoPresentation | undefined, device: PresentationDevice) {
  return normalizePresentation(presentation?.[device] ?? presentation?.mobile ?? presentation?.desktop);
}

export function presentationForSlot(config: WeddingConfig, slot: Exclude<PresentationSlot, "gallery" | "love-story">) {
  return config.mediaPresentation?.[slot];
}
