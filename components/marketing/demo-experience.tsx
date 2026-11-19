"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { demoThemes, demoThemeCssVars, demoTierFilters, demoTierGroup, type DemoTheme, type DemoTierGroup } from "@/data/demo-themes";
import { demoWeddingConfig } from "@/data/demo-wedding";
import { WeddingInvitation } from "@/components/wedding/wedding-invitation";

// Halaman demo "satu undangan, semua tema": undangan contoh fiktif yang
// sama dirender dengan 5 palet tema. Ganti tema langsung mengubah tampilan
// (variabel CSS --w-* + font) tanpa reload; URL ?tema=... ikut diperbarui
// supaya tema yang sedang dilihat bisa dibagikan. Sampul (gate) sengaja
// tetap tampil — pembeli melihat pengalaman lengkap — dan bilah pemilih tema
// berada di atas sampul (z-110) supaya tetap bisa dipakai sebelum undangan dibuka.
// Tinggi bilah diukur langsung (ResizeObserver) karena tingginya berubah-ubah:
// teks membungkus berbeda per lebar layar dan per huruf tema. Sampul memakai
// tinggi ini sebagai offset atas (--demo-bar-h) supaya bagian atas sampul
// (foto + nama mempelai) tidak pernah tersembunyi di balik bilah yang menempel.
//
// Di BAWAH undangan ada bagian "Pilih Tema" mengikuti pola katalog
// Indoinvite (/hasil/... — baris swatch warna + pil kategori + kartu tema),
// disesuaikan ke 5 tema kami dan diperbaiki kekurangannya: klik swatch/pil
// mengganti/memfilter LANGSUNG tanpa reload (Indoinvite me-reload halaman
// penuh), TIDAK ADA kolom pencarian (cuma 5 tema), TIDAK ADA angka pemakaian
// atau skor bintang — angka seragam seperti itu bukan hitungan asli dan
// dilarang ditiru. Tiap kartu memakai pratinjau mini LIVE yang dirender
// dengan variabel CSS tema itu sendiri (bukan tangkapan layar), plus harga
// asli dari business-config dan dua aksi: "Lihat Demo" (ganti tema demo +
// gulir ke atas ke undangan) dan "Pilih Tema Ini" (ke form order /#pesan
// dengan tema itu sudah terpilih lewat ?tema=).
export function DemoExperience({ initialTheme }: { initialTheme: DemoTheme }) {
  const [theme, setTheme] = useState(initialTheme);
  const [filter, setFilter] = useState<"Semua" | DemoTierGroup>("Semua");
  const headerRef = useRef<HTMLElement>(null);
  const [barH, setBarH] = useState(0);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setBarH(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const themedConfig = useMemo(
    () => ({
      ...demoWeddingConfig,
      theme: {
        primary: theme.palette.primary,
        dark: theme.palette.dark,
        accent: theme.palette.accent,
        cream: theme.palette.cream,
        gold: theme.palette.gold,
        softWhite: theme.palette.softWhite,
        text: theme.palette.text,
      },
    }),
    [theme],
  );
  const vars = { ...demoThemeCssVars(theme), "--demo-bar-h": `${barH}px` } as CSSProperties;

  function select(next: DemoTheme) {
    setTheme(next);
    window.history.replaceState(null, "", `/demo?tema=${next.slug}`);
    // Judul tab ikut tema aktif — formatnya SAMA PERSIS dengan judul server
    // di app/demo/page.tsx (generateMetadata), supaya judul tidak tertinggal
    // di tema sebelumnya saat ganti tanpa reload.
    document.title = `Contoh Undangan Tema ${next.name} — Rp${next.amount.toLocaleString("id-ID")} | UNDANGI`;
  }

  // "Lihat Demo" di kartu pemilih: ganti tema demo lalu gulir ke atas ke undangan.
  function viewDemo(next: DemoTheme) {
    select(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const visibleThemes = filter === "Semua" ? demoThemes : demoThemes.filter((option) => demoTierGroup(option) === filter);

  return (
    <div style={vars} className="min-h-screen bg-[var(--w-soft-white)] font-blush-body text-[var(--w-text)]">
      <header ref={headerRef} className="sticky top-0 z-[110] border-b border-black/5 bg-[var(--w-soft-white)]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <a href="/" className="text-sm font-bold tracking-[.28em] text-[var(--w-primary)]">UNDANGI</a>
            <p className="rounded-full bg-[var(--w-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-white">Contoh Demo — Data Fiktif</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--w-muted)]">
            Ini undangan contoh — nama, tanggal, alamat, dan foto hanya contoh fiktif untuk melihat tema. Pilih tema di bawah untuk membandingkan tampilannya.
          </p>
          <div role="group" aria-label="Pilih tema undangan" className="mt-3 flex flex-wrap gap-2 pb-1">
            {demoThemes.map((option) => {
              const active = option.slug === theme.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => select(option)}
                  aria-pressed={active}
                  className={`min-h-12 shrink-0 rounded-full border px-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--w-primary)] ${active ? "border-[var(--w-primary)] bg-[var(--w-primary)] text-white" : "border-[var(--w-primary)]/25 bg-white/60 text-[var(--w-text)] hover:border-[var(--w-primary)]/60"}`}
                >
                  <span className="block text-xs font-bold leading-4">{option.name}</span>
                  <span className={`block text-[11px] leading-4 ${active ? "text-white/75" : "text-[var(--w-muted)]"}`}>Rp{option.amount.toLocaleString("id-ID")} · {option.tier}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pb-1">
            <p className="text-xs font-semibold text-[var(--w-primary)]">
              Tema {theme.name} — Rp{theme.amount.toLocaleString("id-ID")} <span className="font-normal text-[var(--w-muted)] line-through">Rp{theme.originalAmount.toLocaleString("id-ID")}</span>
            </p>
            <a href="/#pesan" className="inline-flex min-h-11 items-center rounded-full bg-[var(--w-primary)] px-5 text-xs font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--w-primary)]">
              Pesan Tema {theme.name}
            </a>
          </div>
        </div>
      </header>
      <WeddingInvitation config={themedConfig} demo />
      <section id="pilih-tema" aria-labelledby="pilih-tema-title" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
          <p className="text-center text-[11px] font-bold uppercase tracking-[.2em] text-[#BF6D87]">Bandingkan tema</p>
          <h2 id="pilih-tema-title" className="font-blush-display mt-2 text-center text-3xl text-[#482C34] sm:text-4xl">Pilih Tema</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 text-[#665457]">
            Satu undangan contoh yang sama — Fajar &amp; Kirana — dalam lima tema. Pilih warna atau tingkat desain untuk menyaring, lihat pratinjau tiap tema, lalu pesan tema yang kamu suka.
          </p>

          {/* Swatch warna: satu lingkaran per tema, memakai warna utama tema itu.
              Klik mengganti tema demo langsung tanpa reload (lebih baik dari
              referensi yang me-reload halaman penuh). Tema aktif ditandai cincin. */}
          <div role="group" aria-label="Pilih tema berdasarkan warna" className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {demoThemes.map((option) => {
              const active = option.slug === theme.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => select(option)}
                  aria-pressed={active}
                  aria-label={`Pilih tema ${option.name}`}
                  title={option.name}
                  style={{
                    backgroundColor: option.palette.primary,
                    boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${option.palette.primary}` : "0 0 0 1px rgba(0,0,0,.08)",
                  }}
                  className="size-11 rounded-full transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BF6D87] sm:size-12"
                />
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-[#665457]" aria-live="polite">
            Tema aktif: {theme.name} — Rp{theme.amount.toLocaleString("id-ID")}
          </p>

          {/* Pil tingkat desain — hanya kelompok yang sudah ada di katalog. */}
          <div role="group" aria-label="Saring tema berdasarkan tingkat desain" className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {demoTierFilters.map((label) => {
              const active = filter === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFilter(label)}
                  aria-pressed={active}
                  className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87] ${active ? "border-[#BF6D87] bg-[#BF6D87] text-white" : "border-[#BF6D87]/25 bg-white text-[#482C34] hover:border-[#BF6D87]/60"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Kartu tema — satu kolom di HP. Pratinjau mini dirender LIVE dengan
              variabel CSS tema kartu itu (blok sampul kecil: latar tema, nama
              dengan huruf display tema, tombol mini "Buka Undangan") — bukan
              tangkapan layar. Harga asli dari business-config. */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleThemes.map((option) => {
              const viewing = option.slug === theme.slug;
              return (
                <article key={option.slug} className="flex flex-col overflow-hidden rounded-3xl border border-[#BF6D87]/15 bg-white shadow-sm">
                  <div style={demoThemeCssVars(option) as CSSProperties} className="bg-[var(--w-dark)] px-4 py-8 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[var(--w-gold)]">The Wedding Of</p>
                    <p style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-3xl leading-tight text-[var(--w-soft-white)]">Fajar &amp; Kirana</p>
                    <p className="mt-1 text-xs tracking-[.2em] text-[var(--w-soft-white)]/75">13 . 06 . 2027</p>
                    <button type="button" onClick={() => viewDemo(option)} className="mt-4 inline-flex min-h-9 items-center rounded-full bg-[var(--w-primary)] px-4 text-xs font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                      Buka Undangan
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#BF6D87]">Tema {option.name}</p>
                      {viewing && <span className="rounded-full bg-[#BF6D87] px-2 py-1 text-[10px] font-bold text-white">Sedang dilihat</span>}
                    </div>
                    <h3 className="mt-1 text-xl font-bold text-[#482C34]">{option.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-[#DD9D7F]">{option.tier}</p>
                    <p className="mt-3 flex-1 text-sm leading-6 text-[#665457]">{option.description}</p>
                    <p className="mt-3 text-sm text-[#806D70]">
                      <span className="line-through">Rp{option.originalAmount.toLocaleString("id-ID")}</span>{" "}
                      <span className="ml-1 rounded-full bg-[#BF6D87] px-2 py-1 text-[10px] font-bold text-white">-{option.discountPercent}%</span>
                    </p>
                    <p className="font-blush-display mt-2 text-4xl text-[#482C34]">Rp{option.amount.toLocaleString("id-ID")}</p>
                    <div className="mt-6 flex flex-col gap-3">
                      <button type="button" onClick={() => viewDemo(option)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
                        Lihat Demo
                      </button>
                      <a href={`/?tema=${option.slug}#pesan`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#BF6D87]/25 px-5 text-sm font-semibold text-[#BF6D87] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
                        Pilih Tema Ini
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs leading-6 text-[#806D70]">Semua tema sudah termasuk semua fitur — perbedaan harga hanya pada desain tema. Harga di atas sudah harga Diskon Awal sampai 31 Desember 2026.</p>
        </div>
      </section>
    </div>
  );
}
