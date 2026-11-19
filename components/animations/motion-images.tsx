"use client";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { usePerformanceMode } from "@/hooks/use-performance-mode";
import { ResponsivePhoto } from "@/components/wedding/responsive-photo";
import type { ResponsivePhotoPresentation } from "@/types/wedding";

type ImageProps = { src: string; alt: string; className?: string; priority?: boolean; sizes?: string; objectPosition?: string; fit?: "cover" | "contain"; presentation?: ResponsivePhotoPresentation };
type AnimatedImageProps = ImageProps & { direction?: "in" | "out" | "pan"; drift?: "vertical" | "horizontal"; safeCrop?: boolean };
type ParallaxImageProps = ImageProps & { safeCrop?: boolean };
const Img = ({ src, alt, className = "", priority, sizes = "100vw", objectPosition, fit = "cover", presentation }: ImageProps) => fit === "cover" ? <ResponsivePhoto src={src} alt={alt} priority={priority} sizes={sizes} className={className} presentation={presentation} fallbackPosition={objectPosition} /> : <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} style={{ objectFit: fit, objectPosition }} />;

export function SlowZoomImage({ direction = "in", safeCrop = false, ...props }: AnimatedImageProps) {
  const mode = usePerformanceMode();
  const frames = safeCrop ? [1, 1.025, 1] : direction === "out" ? [1.07, 1.015, 1.07] : direction === "pan" ? [1.035, 1.065, 1.035] : [1, 1.06, 1];
  return <motion.div className="absolute -inset-1" animate={mode === "reduced" ? { scale: 1.02 } : { scale: frames, y: direction === "pan" && mode === "full" ? [0, -5, 0] : 0 }} transition={{ duration: direction === "out" ? 22 : 18, repeat: Infinity, ease: "easeInOut" }}><Img {...props} /></motion.div>;
}
export function PanImage(props: ImageProps) { const mode = usePerformanceMode(); return <motion.div className="absolute -inset-3" animate={mode === "full" ? { x: [0, -8, 0], y: [0, 3, 0] } : {}} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}><Img {...props} /></motion.div>; }
export function FloatingImage({ children, className = "" }: { children: ReactNode; className?: string }) { const mode = usePerformanceMode(); return <motion.div className={className} animate={mode === "full" ? { y: [0, -7, 0], rotate: [0, .4, 0] } : {}} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}>{children}</motion.div>; }
export function RevealImage({ drift, ...props }: AnimatedImageProps) {
  const mode = usePerformanceMode();
  const driftMotion = drift === "horizontal" ? { x: [0, -5, 0], scale: [1.015, 1.03, 1.015] } : { y: [0, -5, 0], scale: [1.015, 1.025, 1.015] };
  return <motion.div className="relative h-full w-full overflow-hidden" initial={{ opacity: 0, scale: 1.045, filter: "blur(7px)" }} whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: .85, ease: [0.22, 1, 0.36, 1] }}><motion.div className="absolute inset-0" animate={drift && mode === "full" ? driftMotion : {}} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}><Img {...props} /></motion.div></motion.div>;
}
export function MaskReveal({ children, className = "" }: { children: ReactNode; className?: string }) { return <motion.div className={className} initial={{ clipPath: "inset(100% 0 0 0)" }} whileInView={{ clipPath: "inset(0% 0 0 0)" }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>; }
export function ParallaxImage({ safeCrop = false, ...props }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mode = usePerformanceMode();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], safeCrop ? ["-2%", "2%"] : ["-7%", "7%"]);
  const transition = { duration: 20, repeat: Infinity, ease: "easeInOut" as const };

  if (!safeCrop) return <div ref={ref} className="relative h-full w-full overflow-hidden"><motion.div className="absolute -inset-y-[11%] inset-x-0" style={mode === "full" ? { y } : undefined} animate={mode === "reduced" ? {} : { scale: [1.02, 1.075, 1.02] }} transition={transition}><Img {...props} /></motion.div></div>;

  return <div ref={ref} className="relative h-full w-full overflow-hidden">
    <motion.div className="absolute inset-x-0 top-0 aspect-video sm:hidden" animate={mode === "reduced" ? {} : { scale: [1, 1.003, 1] }} transition={transition}><Img {...props} /></motion.div>
    <motion.div className="absolute -inset-y-[5%] inset-x-0 hidden sm:block" style={mode === "full" ? { y } : undefined} animate={mode === "reduced" ? {} : { scale: [1, 1.01, 1] }} transition={transition}><Img {...props} /></motion.div>
  </div>;
}
export function LayeredScene({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`relative isolate overflow-hidden [perspective:1000px] ${className}`}>{children}</div>; }
