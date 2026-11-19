"use client";
import { motion } from "framer-motion";
import { MailOpen } from "lucide-react";
import { SlowZoomImage } from "@/components/animations/motion-images";
import { FloralMark } from "./floral-mark";
import type { WeddingConfig } from "@/types/wedding";

export function InvitationGate({ config, guest, opening, onOpen, demo = false }: { config: WeddingConfig; guest: string; opening: boolean; onOpen: () => void; demo?: boolean }) {
  // Mode demo: sampul tidak menutupi layar penuh — kotak sampul dimulai di
  // bawah bilah demo yang menempel (tinggi bilah di --demo-bar-h, diukur
  // langsung di halaman demo), supaya foto dan nama mempelai selalu tampil
  // utuh setelah ganti tema, setelah reload, dan saat menggulir. Di luar
  // demo (undangan live) sampul tetap fixed inset-0 seperti semula.
  const frameClass = demo
    ? "fixed inset-x-0 bottom-0 top-[var(--demo-bar-h,0px)] z-[100] grid place-items-center overflow-hidden bg-[var(--w-dark)] text-[var(--w-soft-white)]"
    : "fixed inset-0 z-[100] grid min-h-[100svh] place-items-center overflow-hidden bg-[var(--w-dark)] text-[var(--w-soft-white)]";
  return <motion.section aria-label="Sampul undangan" className={frameClass} animate={opening ? { opacity: 0, filter: "blur(7px)", scale: 1.045 } : { opacity: 1 }} transition={{ duration: .82, delay: .48, ease: [0.4, 0, 0.2, 1] }} style={{ pointerEvents: opening ? "none" : "auto" }}>
    <motion.div className="absolute inset-0" animate={opening ? { scale: 1.085, y: -5 } : { scale: 1 }} transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}><SlowZoomImage direction="pan" src={config.assets.cover} presentation={config.mediaPresentation?.cover} alt={`Foto ${config.couple.display}`} priority sizes="100vw" objectPosition="50% 55%" /></motion.div>
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,8,14,.54),rgba(61,15,24,.46)_40%,rgba(28,7,11,.92))]" />
    <motion.div aria-hidden className="absolute -left-20 top-[-5rem] h-72 w-72 rounded-full border border-[var(--w-gold)]/16" animate={opening ? { x: -80, y: -30, opacity: 0 } : { x: 0, y: [0, 5, 0], opacity: 1 }} transition={opening ? { duration: .8 } : { duration: 12, repeat: Infinity, ease: "easeInOut" }} />
    <motion.div aria-hidden className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full border border-[var(--w-gold)]/12" animate={opening ? { x: 90, y: 40, opacity: 0 } : { x: 0, y: [0, -6, 0], opacity: 1 }} transition={opening ? { duration: .8 } : { duration: 14, repeat: Infinity, ease: "easeInOut" }} />
    <motion.div className="gate-content relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-7 py-8 text-center" animate={opening ? { opacity: 0, y: -22, scale: .985 } : { opacity: 1, y: 0 }} transition={{ duration: .5, ease: "easeOut" }}>
      <div className="gate-title flex flex-col items-center"><FloralMark className="mb-5" /><p className="text-[.7rem] uppercase tracking-[.32em] text-[var(--w-cream)]/75">The Wedding of</p>
        <h1 className="font-serif-display mt-3 text-[clamp(3.15rem,16vw,5.8rem)] leading-[.82] tracking-[-.05em]">{config.couple.first}<span className="block py-2 text-[.42em] italic text-[var(--w-gold-pale)]">&</span>{config.couple.second}</h1>
      </div>
      <div className="gate-guest flex flex-col items-center"><div className="my-6 h-px w-14 bg-[var(--w-gold)]/50" /><p className="text-xs tracking-[.16em] text-[var(--w-cream)]/65">Kepada Yth.</p>
        <p className="mt-2 max-w-[19rem] break-words font-serif-display text-[clamp(1.35rem,6vw,1.6rem)] leading-tight italic text-[var(--w-soft-white)]">{guest}</p>
        <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--w-cream)]/72">Tanpa mengurangi rasa hormat, kami mengundang Anda untuk menghadiri acara pernikahan kami.</p>
        <motion.button whileTap={{ scale: .94 }} onClick={onOpen} disabled={opening} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--w-gold-pale)]/45 bg-[var(--w-primary)]/88 px-7 text-sm font-medium tracking-wide shadow-[0_16px_45px_rgba(0,0,0,.22)] backdrop-blur transition-colors hover:bg-[var(--w-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--w-cream)] disabled:opacity-60"><MailOpen aria-hidden size={17} /> Buka Undangan</motion.button>
        <p className="mt-5 text-[.68rem] tracking-[.22em] text-[var(--w-cream)]/55">{config.dateLabel}</p>
      </div>
    </motion.div>
    {opening && <motion.div aria-hidden className="absolute inset-y-0 left-0 z-20 w-full bg-[linear-gradient(90deg,var(--w-dark),var(--w-primary)_48%,var(--w-dark))]" initial={{ x: "-110%" }} animate={{ x: "110%" }} transition={{ delay: .22, duration: 1.05, ease: [0.76, 0, 0.24, 1] }} />}
  </motion.section>;
}
