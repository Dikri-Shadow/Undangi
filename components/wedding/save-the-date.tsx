"use client";
import { motion } from "framer-motion";
import { useCountdown } from "@/hooks/use-countdown";
import { SectionHeading } from "./section-heading";
export function SaveTheDate({ target, label }: { target: string | null; label: string }) {
  const count = useCountdown(target); const units = [[count.days, "Hari"], [count.hours, "Jam"], [count.minutes, "Menit"], [count.seconds, "Detik"]] as const;
  return <section className="relative overflow-hidden bg-[var(--w-dark)] px-5 py-24 text-[var(--w-soft-white)] sm:py-32 lg:px-12 lg:py-28"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(201,166,107,.12),transparent_44%)]" /><div className="relative mx-auto max-w-6xl"><SectionHeading eyebrow={label} title="Save the Date" light /><div className="grid grid-cols-4 border-y border-[var(--w-gold)]/25">{units.map(([value, unit], index) => <motion.div key={unit} className={`py-7 text-center lg:py-10 ${index ? "border-l border-[var(--w-gold)]/20" : ""}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }}><span className="font-serif-display block text-[clamp(2.2rem,10vw,5rem)] leading-none text-[var(--w-gold-light)] tabular-nums lg:text-7xl">{String(value).padStart(2, "0")}</span><span className="mt-3 block text-[.62rem] uppercase tracking-[.18em] text-white/55 lg:text-xs">{unit}</span></motion.div>)}</div></div></section>;
}
