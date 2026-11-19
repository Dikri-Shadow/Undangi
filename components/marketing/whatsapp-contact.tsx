"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { businessConfig } from "@/data/business-config";

export const openContactEvent = "undangi:open-contact";

export function ContactTrigger({ children, className }: { children: React.ReactNode; className: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(openContactEvent))}>{children}</button>;
}

export function WhatsAppContact() {
  const [open, setOpen] = useState(false);
  // Tombol mengambang hanya boleh muncul bila tidak menutupi apa pun di HP:
  // (1) sembunyi selama hero masih terlihat — di scroll 0 ia menutupi baris
  // pembayaran hero dan label preview; (2) sembunyi saat menggulir ke bawah,
  // muncul lagi saat menggulir ke atas; (3) sembunyi saat seksi yang
  // elemennya memanjang sampai tepi kanan (#acara, #harga, #contoh, #pesan,
  // #faq) sedang terlihat — tombol pemilih acara, tombol selebar layar di
  // Tema dan Harga ("Lihat Demo" / "Pilih ..."), sudut foto contoh, kolom
  // form, dan ikon "+" FAQ tidak boleh tertutup. Saat panel kontak terbuka
  // tombol tetap terlihat (untuk menutup).
  const [scrollVisible, setScrollVisible] = useState(true);
  const [pastHero, setPastHero] = useState(false);
  const [quietZone, setQuietZone] = useState(false);
  const lastY = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    const heroBottom = () => {
      const hero = document.getElementById("hero");
      if (!hero) return 600;
      return hero.getBoundingClientRect().bottom + window.scrollY;
    };
    const update = () => {
      const y = window.scrollY;
      if (y > lastY.current + 4 && y > 120) setScrollVisible(false);
      else if (y < lastY.current - 4) setScrollVisible(true);
      lastY.current = y;
      setPastHero(y > heroBottom());
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const seen = new Set<string>();
    const targets = ["acara", "harga", "contoh", "pesan", "faq"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).id;
        if (entry.isIntersecting) seen.add(id);
        else seen.delete(id);
      }
      setQuietZone(seen.size > 0);
    }, { threshold: 0 });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(openContactEvent, show);
    return () => window.removeEventListener(openContactEvent, show);
  }, []);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const shown = open || (pastHero && scrollVisible && !quietZone);
  return <div className={`fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] right-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 transition-all duration-300 sm:bottom-6 sm:right-6 ${shown ? "" : "pointer-events-none invisible translate-y-24 opacity-0"}`}>
    {open && <div role="dialog" aria-modal="false" aria-labelledby="contact-title" className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-[#BF6D87]/10 bg-[#FDF3F1] p-5 shadow-[0_24px_70px_rgba(72,44,52,.24)]">
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#238C4C]/10 text-[#19723B]"><MessageCircle aria-hidden size={20} /></div>
        <div className="min-w-0 flex-1">
          <h2 id="contact-title" className="font-blush-display text-2xl font-semibold text-[#482C34]">Hubungi Admin UNDANGI</h2>
          <p className="mt-2 text-sm leading-6 text-[#665457]">Untuk pemesanan, konsultasi desain, request custom, atau informasi lebih lanjut, lanjutkan melalui WhatsApp.</p>
        </div>
        <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Tutup kontak WhatsApp" className="grid size-10 shrink-0 place-items-center rounded-full text-[#BF6D87] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]"><X size={18} /></button>
      </div>
      <a href={businessConfig.whatsapp.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#237A45] px-5 text-sm font-bold text-white transition hover:bg-[#1D693B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#237A45]"><MessageCircle aria-hidden size={18} /> Chat WhatsApp</a>
    </div>}
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Tutup kontak WhatsApp" : "Hubungi Admin UNDANGI melalui WhatsApp"} aria-expanded={open} tabIndex={shown ? 0 : -1} className="grid size-12 place-items-center rounded-full border-4 border-[#FDF3F1] bg-[#237A45] text-white shadow-[0_14px_35px_rgba(35,122,69,.28)] transition hover:-translate-y-0.5 hover:bg-[#1D693B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#237A45] sm:size-14"><MessageCircle aria-hidden size={22} className="sm:hidden" /><MessageCircle aria-hidden size={25} className="hidden sm:block" /></button>
  </div>;
}
