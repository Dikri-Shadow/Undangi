"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { businessConfig } from "@/data/business-config";

// Header sticky landing (tema Blush Sakura). Di layar besar tampil link
// navigasi biasa; di HP tampil tombol hamburger (area sentuh min 48px)
// yang membuka menu berisi link ke semua seksi landing + CTA WhatsApp.
// Menu memakai z-60 supaya saat terbuka ia berada DI ATAS tombol WhatsApp
// mengambang (z-50) — tidak bertumpuk berantakan. Menu menutup saat salah
// satu link diklik atau saat tombol Escape ditekan.
const navLinks = [
  { href: "#harga", label: "Tema dan Harga" },
  { href: "#acara", label: "Jenis Acara" },
  { href: "#contoh", label: "Contoh" },
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#faq", label: "FAQ" },
] as const;

// basePath: "" di landing (tautan jangkar "#acara"), "/" di halaman lain
// (mis. /acara/*) supaya tautan navigasi kembali ke seksi landing.
export function MarketingHeader({ basePath = "" }: { basePath?: string }) {
  const [open, setOpen] = useState(false);
  const links = navLinks.map(({ href, label }) => ({ href: `${basePath}${href}`, label }));

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open ]);

  return (
    <header className="sticky top-0 z-[60] border-b border-[#BF6D87]/10 bg-[#FDF3F1]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href={`${basePath}#top`} className="rounded-sm text-sm font-bold tracking-[0.28em] text-[#482C34] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BF6D87]">
          UNDANGI
        </a>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 md:flex">
          {links.map(({ href, label }) => (
            <a key={href} href={href} className="text-sm text-[#482C34] transition-colors hover:text-[#BF6D87] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BF6D87]">
              {label}
            </a>
          ))}
          <a href={businessConfig.whatsapp.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
            Minta Dibuatin Admin
          </a>
        </nav>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
          aria-expanded={open}
          aria-controls="menu-navigasi"
          className="grid min-h-12 min-w-12 place-items-center rounded-full text-[#482C34] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87] md:hidden"
        >
          {open ? <X aria-hidden size={24} /> : <Menu aria-hidden size={24} />}
        </button>
      </div>
      {open && (
        <nav id="menu-navigasi" aria-label="Menu navigasi" className="border-t border-[#BF6D87]/10 bg-[#FDF3F1] px-5 pb-6 pt-2 sm:px-8 md:hidden">
          <ul className="divide-y divide-[#BF6D87]/10">
            {links.map(({ href, label }) => (
              <li key={href}>
                <a href={href} onClick={() => setOpen(false)} className="flex min-h-12 items-center text-sm font-semibold text-[#482C34] transition hover:text-[#BF6D87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            <a href={businessConfig.whatsapp.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
              Minta Dibuatin Admin
            </a>
            <a href={`${basePath}#pesan`} onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#BF6D87]/25 px-5 text-sm font-semibold text-[#BF6D87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
              Pesan Sekarang
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
