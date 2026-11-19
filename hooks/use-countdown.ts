"use client";
import { useEffect, useState } from "react";

function calculate(target: string | null) {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const delta = Math.max(0, new Date(target).getTime() - Date.now());
  return { days: Math.floor(delta / 86400000), hours: Math.floor(delta / 3600000) % 24, minutes: Math.floor(delta / 60000) % 60, seconds: Math.floor(delta / 1000) % 60 };
}
export function useCountdown(target: string | null) {
  const [value, setValue] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const update = () => setValue(calculate(target));
    const frame = requestAnimationFrame(update);
    const id = window.setInterval(update, 1000);
    return () => { cancelAnimationFrame(frame); clearInterval(id); };
  }, [target]);
  return value;
}
