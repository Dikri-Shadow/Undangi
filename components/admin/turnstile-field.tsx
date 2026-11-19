"use client";
import { useEffect, useRef } from "react";

declare global { interface Window { turnstile?: { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string; remove: (id: string) => void } } }
export function TurnstileField({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    const render = () => {
      if (!active || !container.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, { sitekey: siteKey, callback: onToken, "expired-callback": () => onToken("") });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-undangi-turnstile="true"]');
    if (window.turnstile) render();
    else if (existing) existing.addEventListener("load", render, { once: true });
    else { const script = document.createElement("script"); script.dataset.undangiTurnstile = "true"; script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.defer = true; script.addEventListener("load", render, { once: true }); document.head.appendChild(script); }
    return () => { active = false; existing?.removeEventListener("load", render); if (widgetId.current) { window.turnstile?.remove(widgetId.current); widgetId.current = null; } };
  }, [onToken, siteKey]);
  return <div ref={container} aria-label="Verifikasi keamanan" />;
}
