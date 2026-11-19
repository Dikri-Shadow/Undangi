"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { WeddingConfig } from "@/types/wedding";
import { SectionHeading } from "./section-heading";
import { ResponsivePhoto } from "./responsive-photo";

export function Gallery({ images, excludeOnDesktop = [] }: { images: WeddingConfig["gallery"]; excludeOnDesktop?: string[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const move = useCallback((delta: number) => setSelected((current) => current === null ? null : (current + delta + images.length) % images.length), [images.length]);

  useEffect(() => {
    document.body.classList.toggle("lightbox-open", selected !== null);
    return () => document.body.classList.remove("lightbox-open");
  }, [selected]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [move]);

  return <section id="gallery" className="relative bg-[var(--w-cream)] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-24 sm:px-6 sm:py-32 lg:px-12 lg:py-28">
    <div aria-hidden className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--w-soft-white)]/70 to-transparent" />
    <div className="relative mx-auto max-w-6xl"><SectionHeading eyebrow="Captured Moments" title="Dalam setiap bingkai" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12 lg:auto-rows-[220px] lg:gap-5">
        {images.map((image, index) => <motion.button key={`${image.src}-${index}`} onClick={() => setSelected(index)} className={`group relative overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--w-primary)] ${index % 3 === 0 ? "col-span-2 aspect-[4/5]" : "aspect-square"} ${index % 4 === 0 ? "lg:col-span-7 lg:row-span-2 lg:aspect-auto" : index % 4 === 3 ? "lg:col-span-12 lg:row-span-2 lg:aspect-auto" : "lg:col-span-5 lg:row-span-1 lg:aspect-auto"} ${excludeOnDesktop.includes(image.src) ? "lg:hidden" : ""}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8%" }} transition={{ delay: (index % 3) * .08 }} aria-label={`Buka foto ${index + 1}`}>
          <ResponsivePhoto src={image.src} alt={image.alt} sizes="(max-width: 640px) 50vw, 33vw" className="transition duration-700 group-hover:scale-[1.025]" presentation={image.presentation} fallbackPosition={image.position} />
          <span className="absolute inset-0 bg-[var(--w-dark)]/0 transition group-hover:bg-[var(--w-dark)]/10" />
        </motion.button>)}
      </div>
    </div>
    <AnimatePresence>{selected !== null && <motion.div role="dialog" aria-modal="true" aria-label="Galeri foto" className="fixed inset-0 z-[120] grid place-items-center bg-[var(--w-deep)]/96 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
      <button className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur" onClick={() => setSelected(null)} aria-label="Tutup galeri"><X /></button>
      <button className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white" onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label="Foto sebelumnya"><ChevronLeft /></button>
      <motion.div key={selected} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 55) move(info.offset.x > 0 ? -1 : 1); }} className="relative h-[78svh] w-[min(86vw,980px)] touch-pan-y" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} onClick={(event) => event.stopPropagation()}>
        <Image src={images[selected].src} alt={images[selected].alt} fill priority sizes="90vw" className="object-contain" />
      </motion.div>
      <button className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white" onClick={(event) => { event.stopPropagation(); move(1); }} aria-label="Foto selanjutnya"><ChevronRight /></button>
      <p className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] text-xs tracking-[.2em] text-white/55">{selected + 1} / {images.length}</p>
    </motion.div>}</AnimatePresence>
  </section>;
}
