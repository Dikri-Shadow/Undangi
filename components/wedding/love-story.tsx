"use client";
import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { RevealImage } from "@/components/animations/motion-images";
import type { WeddingConfig } from "@/types/wedding";
import { SectionHeading } from "./section-heading";

export function LoveStory({ items, coupleName }: { items: WeddingConfig["loveStory"]; coupleName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const textOnly = items.every((item) => !item.image);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  return <section className="bg-[var(--w-soft-white)] px-6 py-24 sm:py-32 lg:px-12 lg:py-28"><div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Our Journey" title="Cerita yang membawa kami ke sini" /><div ref={ref} className={`relative space-y-14 sm:space-y-20 ${textOnly ? "lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0" : "lg:space-y-14"}`}><motion.div aria-hidden className={`absolute left-3 top-0 h-full w-px origin-top bg-[var(--w-accent)]/35 sm:left-1/2 ${textOnly ? "lg:hidden" : ""}`} style={{ scaleY }} />{items.map((item, index) => <motion.article key={item.id || `${item.year}-${item.title}`} className={`relative ml-8 grid items-center gap-6 sm:ml-0 sm:grid-cols-2 sm:gap-12 ${index % 2 ? "sm:[&>*:first-child]:order-2" : ""} ${textOnly ? "lg:block lg:rounded-3xl lg:border lg:border-[var(--w-primary)]/10 lg:bg-[var(--w-cream)]/65 lg:p-8 lg:text-left" : ""}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }}><span className={`absolute -left-[1.43rem] top-2 h-3 w-3 rounded-full border-2 border-[var(--w-soft-white)] bg-[var(--w-accent)] sm:left-1/2 sm:-translate-x-1/2 ${textOnly ? "lg:hidden" : ""}`} />{item.image && <div className="aspect-[16/10] max-h-[420px] overflow-hidden rounded-2xl"><RevealImage src={item.image} alt={`Love Story ${coupleName.replace("&", "dan")} - ${item.title}`} sizes="(max-width: 640px) 85vw, 44vw" /></div>}<div className={`${item.image ? "" : "sm:col-span-2 sm:mx-auto sm:max-w-2xl sm:text-center lg:mx-0 lg:text-left"}`}><p className="font-serif-display text-2xl text-[var(--w-accent)]">{item.year}</p><h3 className="font-serif-display mt-2 text-3xl text-[var(--w-dark)]">{item.title}</h3><p className="mt-3 max-w-prose leading-7 text-[var(--w-muted)]">{item.description}</p></div></motion.article>)}</div></div></section>;
}
