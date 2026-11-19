"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { ResponsivePhotoPresentation } from "@/types/wedding";
import { presentationFor } from "@/lib/media-presentation";

type Props = { src: string; alt: string; presentation?: ResponsivePhotoPresentation; sizes?: string; priority?: boolean; className?: string; fallbackPosition?: string };

export function ResponsivePhoto({ src, alt, presentation, sizes = "100vw", priority, className = "", fallbackPosition = "50% 50%" }: Props) {
  if (!src?.trim()) return null;
  const mobile = presentationFor(presentation, "mobile");
  const desktop = presentationFor(presentation, "desktop");
  const hasPresentation = Boolean(presentation?.mobile || presentation?.desktop);
  const mobilePosition = `${50 - mobile.x * 50}% ${50 - mobile.y * 50}%`;
  const desktopPosition = `${50 - desktop.x * 50}% ${50 - desktop.y * 50}%`;
  const style = {
    "--photo-mobile-x": `${mobile.x * 100}%`, "--photo-mobile-y": `${mobile.y * 100}%`, "--photo-mobile-scale": String(mobile.zoom), "--photo-mobile-rotate": `${mobile.rotation}deg`,
    "--photo-desktop-x": `${desktop.x * 100}%`, "--photo-desktop-y": `${desktop.y * 100}%`, "--photo-desktop-scale": String(desktop.zoom), "--photo-desktop-rotate": `${desktop.rotation}deg`,
    "--photo-mobile-position": presentation?.mobile ? mobilePosition : hasPresentation ? "50% 50%" : fallbackPosition,
    "--photo-desktop-position": presentation?.desktop ? desktopPosition : hasPresentation ? "50% 50%" : fallbackPosition,
  } as CSSProperties;
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={`object-cover [object-position:var(--photo-mobile-position)] [transform:rotate(var(--photo-mobile-rotate))_scale(var(--photo-mobile-scale))] sm:[object-position:var(--photo-desktop-position)] sm:[transform:rotate(var(--photo-desktop-rotate))_scale(var(--photo-desktop-scale))] ${className}`} style={style} />;
}
