"use client";
import { useEffect, useState } from "react";

export function usePerformanceMode() {
  const [mode, setMode] = useState<"full" | "lite" | "reduced">("lite");
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const override = new URLSearchParams(location.search).get("perf");
      if (override === "reduced" || override === "lite" || override === "full") { setMode(override); return; }
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      if (reduced) setMode("reduced");
      else if ((navigator.hardwareConcurrency || 4) <= 4 || connection?.saveData) setMode("lite");
      else setMode("full");
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return mode;
}
