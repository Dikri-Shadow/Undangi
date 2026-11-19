"use client";
import { useEffect, useRef } from "react";
import { usePerformanceMode } from "@/hooks/use-performance-mode";

export function GoldParticles({ active, className = "" }: { active: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mode = usePerformanceMode();
  useEffect(() => {
    if (!active || mode === "reduced") return;
    const canvas = ref.current; if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true }); if (!context) return;
    let frame = 0, inViewport = false, documentVisible = !document.hidden;
    const ratio = Math.min(devicePixelRatio, 1.5);
    const count = mode === "lite" ? 12 : innerWidth < 640 ? 22 : 32;
    const particles = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), r: .55 + Math.random() * 1.05, speed: .00005 + Math.random() * .00009, drift: (Math.random() - .5) * .000035, phase: Math.random() * 6.28 }));
    const resize = () => { const box = canvas.getBoundingClientRect(); canvas.width = box.width * ratio; canvas.height = box.height * ratio; context.setTransform(ratio, 0, 0, ratio, 0, 0); };
    const draw = (time: number) => {
      frame = 0; if (!inViewport || !documentVisible) return;
      const { width, height } = canvas.getBoundingClientRect(); context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.y -= particle.speed; particle.x += particle.drift;
        if (particle.y < -.03) particle.y = 1.03; if (particle.x < 0) particle.x = 1; if (particle.x > 1) particle.x = 0;
        const alpha = .09 + (Math.sin(time * .001 + particle.phase) + 1) * .1;
        context.beginPath(); context.fillStyle = `rgba(226,196,139,${alpha})`; context.arc(particle.x * width, particle.y * height, particle.r, 0, Math.PI * 2); context.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    const sync = () => { if (inViewport && documentVisible && !frame) frame = requestAnimationFrame(draw); else if ((!inViewport || !documentVisible) && frame) { cancelAnimationFrame(frame); frame = 0; } };
    const observer = new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; sync(); }, { rootMargin: "120px" });
    const onVisibility = () => { documentVisible = !document.hidden; sync(); };
    resize(); observer.observe(canvas); addEventListener("resize", resize, { passive: true }); document.addEventListener("visibilitychange", onVisibility);
    return () => { if (frame) cancelAnimationFrame(frame); observer.disconnect(); removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVisibility); };
  }, [active, mode]);
  if (!active || mode === "reduced") return null;
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
