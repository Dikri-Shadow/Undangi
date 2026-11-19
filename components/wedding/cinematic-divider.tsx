"use client";
import { ResponsivePhoto } from "@/components/wedding/responsive-photo";
import type { ResponsivePhotoPresentation } from "@/types/wedding";
export function CinematicDivider({ image, quote, presentation }: { image: string; quote: string; presentation?: ResponsivePhotoPresentation }) {
  return <section className="relative overflow-hidden bg-[var(--w-text)]">
    <div className="relative aspect-[39/62] w-full overflow-hidden sm:aspect-[16/7]">
      <ResponsivePhoto src={image} presentation={presentation} alt="Foto pasangan saat senja" sizes="100vw" fallbackPosition="48% 42%" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,4,8,.02)_38%,rgba(20,4,8,.2)_60%,rgba(20,4,8,.84)_100%)] sm:bg-[linear-gradient(180deg,rgba(20,4,8,.01)_48%,rgba(20,4,8,.16)_66%,rgba(20,4,8,.8)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 px-7 pb-[calc(7rem+env(safe-area-inset-bottom))] text-center text-white sm:px-12 sm:pb-[clamp(3.75rem,7vh,5.5rem)]">
        <p className="mx-auto max-w-[28rem] font-serif-display text-[clamp(1.65rem,7.2vw,2.25rem)] italic leading-[1.18] sm:max-w-3xl sm:text-[clamp(2.25rem,3.2vw,3.5rem)] sm:leading-[1.14]">“{quote}”</p>
      </div>
    </div>
  </section>;
}
