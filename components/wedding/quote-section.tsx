"use client";
import { motion } from "framer-motion";
import type { WeddingConfig } from "@/types/wedding";
import { FloralMark } from "./floral-mark";
export function QuoteSection({ quote }: { quote: WeddingConfig["quotes"]["opening"] }) { return <section id="quote" className="relative overflow-hidden bg-[var(--w-cream)] px-6 py-24 text-center text-[var(--w-text)] sm:py-32"><div aria-hidden className="absolute left-1/2 top-0 h-px w-28 -translate-x-1/2 bg-[var(--w-accent)]/30" /><motion.div className="mx-auto max-w-2xl" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .8 }}><FloralMark className="mb-7" /><blockquote className="font-serif-display text-[clamp(1.65rem,7vw,2.6rem)] leading-[1.35] tracking-[-.02em]">“{quote.text}”</blockquote><p className="mt-7 text-xs uppercase tracking-[.2em] text-[var(--w-primary)]/70">{quote.source}</p></motion.div></section>; }
