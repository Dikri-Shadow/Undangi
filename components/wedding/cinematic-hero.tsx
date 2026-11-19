"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { GoldParticles } from "@/components/animations/gold-particles";
import { LayeredScene, SlowZoomImage } from "@/components/animations/motion-images";
import { usePerformanceMode } from "@/hooks/use-performance-mode";
import type { WeddingConfig } from "@/types/wedding";

export function CinematicHero({ config, active }: { config: WeddingConfig; active: boolean }) {
  const mode = usePerformanceMode();
  return <LayeredScene className="min-h-[100svh] bg-[var(--w-dark)] text-[var(--w-soft-white)]">
    <SlowZoomImage direction="in" safeCrop src={config.assets.hero} presentation={config.mediaPresentation?.hero} alt={`Potret ${config.couple.display}`} priority sizes="100vw" className="object-[50%_38%] sm:object-[50%_34%]" />
    {mode === "full" && config.assets.hero?.trim() && <motion.div aria-hidden className="absolute -inset-5 opacity-20 [mask-image:linear-gradient(to_top,black_0%,black_24%,transparent_58%)] lg:hidden" animate={{ y: [7, -3, 7], scale: [1.08, 1.11, 1.08] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}><Image src={config.assets.hero} alt="" fill sizes="100vw" className="object-cover object-[50%_50%] blur-[1px]" /></motion.div>}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,4,8,.38),rgba(20,4,8,.08)_35%,rgba(35,8,14,.9)_92%)]" />
    <motion.div aria-hidden className="absolute -right-1/3 top-0 h-2/3 w-4/5 rotate-12 bg-[radial-gradient(ellipse,rgba(226,196,139,.16),transparent_66%)] blur-3xl" animate={active && mode === "full" ? { x: [-18, 20, -18], opacity: [.4, .72, .4] } : { opacity: .38 }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
    <GoldParticles active={active} /><motion.div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-end px-6 pb-16 text-center lg:min-h-[min(900px,100svh)] lg:px-14 lg:pb-20" initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} transition={{ delay: .72, duration: .7 }}>
      <motion.p className="mb-4 text-[.7rem] uppercase tracking-[.35em] text-[var(--w-gold-soft)]" initial={{ y: 16, opacity: 0 }} animate={active ? { y: 0, opacity: 1 } : {}} transition={{ delay: .78, duration: .6 }}>We are getting married</motion.p>
      <motion.h2 className="font-serif-display text-[clamp(4.5rem,21vw,9rem)] leading-[.72] tracking-[-.06em] lg:flex lg:items-center lg:gap-7 lg:text-[clamp(6rem,10vw,9.5rem)] lg:leading-[.8]" initial={{ y: 28, opacity: 0, filter: "blur(10px)", letterSpacing: ".04em" }} animate={active ? { y: 0, opacity: 1, filter: "blur(0px)", letterSpacing: "-.06em" } : {}} transition={{ delay: .7, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}>{config.couple.first}<span className="block py-5 text-[.32em] font-light italic text-[var(--w-gold-soft)] lg:py-0">&</span>{config.couple.second}</motion.h2>
      <motion.p className="mt-7 text-xs tracking-[.32em] text-[var(--w-soft-white)]/75" initial={{ opacity: 0, y: 8 }} animate={active ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.18, duration: .55 }}>{config.dateLabel}</motion.p>
      <motion.a href="#quote" aria-label="Gulir ke isi undangan" className="mt-7 grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white/75" initial={{ opacity: 0 }} animate={active ? mode === "reduced" ? { opacity: 1 } : { opacity: 1, y: [0, 5, 0] } : { opacity: 0 }} transition={{ opacity: { delay: 1.38, duration: .4 }, y: { delay: 1.38, duration: 2.2, repeat: Infinity } }}><ChevronDown aria-hidden size={18} /></motion.a>
    </motion.div>
  </LayeredScene>;
}
