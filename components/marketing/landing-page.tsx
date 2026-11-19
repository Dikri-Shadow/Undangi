"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  CalendarDays, Camera, CheckCircle2, Gift, MessageSquareText, Send,
  UserRound,
} from "lucide-react";
import { businessConfig } from "@/data/business-config";
import { demoThemes, demoThemeCssVars, demoTierFilters, demoTierGroup, resolveDemoTheme, type DemoTierGroup } from "@/data/demo-themes";
import { demoWeddingConfig } from "@/data/demo-wedding";
import { ContactTrigger, WhatsAppContact } from "./whatsapp-contact";
import { EventTypePicker } from "./event-type-picker";
import { OrderForm, setThemeEvent } from "./order-form";

// Urutan seksi landing (dirombak 2026-11-19): pembeli harus melihat produk
// dulu sebelum memilih acara — hero janji anti-rugi + harga -> tema & harga
// (pemilih VISUAL, pola dari demo-experience.tsx) -> pilih jenis acara
// (ringkas) -> contoh (demo fiktif Fajar & Kirana, BUKAN undangan pelanggan)
// -> fitur -> cara kerja -> pesan -> FAQ -> pita custom (rose, di bawah FAQ).
// Tanpa rating/testimoni/statistik palsu — UNDANGI belum punya itu.
// Hero + contoh memakai demoWeddingConfig (Fajar & Kirana, aset
// /images/couple-hero.webp); undangan pelanggan yang sudah jadi TIDAK PERNAH
// dipakai sebagai bahan jualan di landing ini.
const featureGroups = [
  { icon: UserRound, title: "Personalisasi", items: ["Nama tamu personal", "Link undangan personal"] },
  { icon: CalendarDays, title: "Informasi Acara", items: ["Countdown acara", "Waktu dan lokasi", "Google Maps"] },
  { icon: Camera, title: "Foto & Media", items: ["Galeri foto", "Love Story", "Musik undangan", "Editor foto"] },
  { icon: MessageSquareText, title: "Interaksi Tamu", items: ["Konfirmasi kehadiran", "Ucapan & doa"] },
  { icon: Gift, title: "Gift / Hadiah", items: ["Informasi rekening atau e-wallet", "Nomor mudah disalin"] },
] as const;

const steps = [
  ["01", "Ceritakan Acaramu", "Kirim jenis acara, data, dan kebutuhanmu."],
  ["02", "Pilih atau Request Desain", "Gunakan tema yang tersedia atau kirim referensi desain sendiri."],
  ["03", "UNDANGI Mengerjakan", "Desain dan fitur disesuaikan dengan kebutuhan acara."],
  ["04", "Review & Bagikan", "Periksa hasilnya, lakukan revisi bila diperlukan, kemudian bagikan link undangan."],
] as const;

// FAQ menjawab keberatan pembeli dengan jujur. Masa aktif sudah diputuskan
// Zeke: 1 tahun. Untuk hal lain yang belum punya kebijakan resmi (refund),
// jawabannya mengarahkan tanya admin via WhatsApp — jangan mengarang kebijakan.
const faqs = [
  ["Berapa harga undangannya?", "Harga per tema: Sage Klasik Rp29.000, Terracotta Senja Rp29.000, Blush Sakura Rp49.000, Jakarta Modern Rp49.000, Emas Tengah Malam Rp99.000 — harga coret adalah harga normal, dan harga di atas sudah harga Diskon Awal sampai 31 Desember 2026. Semua tema sudah termasuk semua fitur; perbedaan harga hanya pada desain tema."],
  ["Bagaimana cara bayarnya?", "Caranya: 1) Isi formulir singkat di bawah (jenis acara, nomor WhatsApp, tanggal acara, dan tema) — atau langsung chat admin lewat WhatsApp. 2) Admin menghubungimu lewat WhatsApp untuk konfirmasi desain dan total yang harus dibayar. 3) Bayar manual lewat transfer bank atau QRIS — nomor rekening dan kode QRIS diberikan admin lewat WhatsApp setelah konfirmasi. 4) Setelah pembayaran terkonfirmasi, admin buatkan undanganmu. Admin buatkan dulu, bayar hanya kalau kamu suka hasilnya."],
  ["Apakah bisa dibuatin admin dulu?", "Bisa. Kalau tidak mau ribet, kirim data dan kebutuhanmu lewat WhatsApp admin — admin yang buatkan undangannya dulu. Kamu lihat hasilnya, bayar hanya kalau suka."],
  ["Apakah bisa revisi?", "Bisa. Setelah melihat hasil awal, sampaikan revisi yang kamu inginkan kepada admin — revisi dibahas dan disesuaikan saat pengerjaan."],
  ["Apakah undangan ada masa aktifnya?", "Ya. Masa aktif undangan adalah 1 tahun — selama itu undangan tetap bisa dibuka, dibagikan, dan diedit. Kalau ada pertanyaan soal masa aktif, tanyakan langsung ke admin lewat WhatsApp."],
  ["Bagaimana kalau batal — apakah ada refund?", "Ketentuan pembatalan dan refund belum ditetapkan. Kalau ada kemungkinan batal, bicarakan dulu dengan admin lewat WhatsApp sebelum membayar."],
  ["Apakah UNDANGI hanya untuk pernikahan?", "Tidak. UNDANGI dapat digunakan untuk pernikahan, ulang tahun, lamaran, khitanan, aqiqah, acara bisnis, dan berbagai acara lainnya."],
  ["Apakah bisa request desain sendiri?", "Bisa. Kamu dapat mengirim screenshot, link referensi, contoh desain, atau menjelaskan konsep yang diinginkan."],
  ["Apakah undangan bisa memakai nama tamu?", "Bisa. Setiap tamu dapat menerima link undangan dengan nama yang dipersonalisasi."],
  ["Apakah tersedia Google Maps, RSVP, dan musik?", "Ya. Lokasi acara dapat dihubungkan ke Google Maps, tamu dapat mengirim konfirmasi kehadiran serta ucapan dan doa, dan musik undangan dapat disesuaikan."],
  ["Apakah nyaman dibuka di HP?", "Ya. Tampilan dirancang agar tetap nyaman dilihat melalui HP maupun desktop."],
] as const;

function SectionIntro({ eyebrow, title, copy, centered = false }: { eyebrow: string; title: string; copy?: string; centered?: boolean }) {
  return <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
    <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#BF6D87]">{eyebrow}</p>
    <h2 className="font-blush-display mt-3 text-[clamp(2.35rem,7vw,4.5rem)] font-medium leading-[.98] tracking-[-.025em] text-[#482C34]">{title}</h2>
    {copy && <p className="mt-5 text-sm leading-7 text-[#665457] sm:text-base">{copy}</p>}
  </div>;
}

export function LandingPage() {
  // Tema aktif dipakai bersama oleh pratinjau hero dan pemilih tema di bawah:
  // klik swatch/kartu langsung mengganti keduanya tanpa reload.
  const [activeTheme, setActiveTheme] = useState(() => resolveDemoTheme("blush-sakura"));
  const [filter, setFilter] = useState<"Semua" | DemoTierGroup>("Semua");

  // Dibuka lewat /?tema=<slug> (mis. dari /demo): hormati tema itu.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("tema") ?? "";
    if (demoThemes.some((option) => option.slug === slug)) setActiveTheme(resolveDemoTheme(slug));
  }, []);

  // Ganti tema di tempat (tanpa reload, tanpa lompat ke atas): simpan posisi
  // gulir dan kembalikan setelah render, perbarui URL lewat replaceState,
  // dan sinkronkan kolom tema di form order supaya tema yang dipilih di
  // swatch sama dengan tema yang terkirim — bukan tema default form.
  function selectTheme(next: (typeof demoThemes)[number], preserveScroll = true) {
    const y = window.scrollY;
    setActiveTheme(next);
    window.dispatchEvent(new CustomEvent<string>(setThemeEvent, { detail: next.slug }));
    window.history.replaceState(null, "", `/?tema=${next.slug}`);
    if (preserveScroll) requestAnimationFrame(() => window.scrollTo(0, y));
  }

  // "Pilih Tema Ini": tema terpilih langsung terisi di formulir order
  // (lewat event ke OrderForm) lalu gulir ke formulir — tanpa reload.
  function chooseTheme(next: (typeof demoThemes)[number]) {
    selectTheme(next, false);
    document.getElementById("pesan")?.scrollIntoView({ behavior: "smooth" });
  }

  const visibleThemes = filter === "Semua" ? demoThemes : demoThemes.filter((option) => demoTierGroup(option) === filter);
  const couple = demoWeddingConfig.couple.display;

  return <main id="top" className="marketing-page min-h-screen overflow-x-clip bg-[#FDF3F1] font-blush-body text-[#482C34]">
    <section id="hero" className="relative overflow-hidden border-b border-[#BF6D87]/10 pt-8 sm:pt-10">
      <div className="pointer-events-none absolute -right-32 top-8 size-80 rounded-full bg-[#BF6D87]/[.06] blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 lg:min-h-[760px] lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-12 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold tracking-[.3em] text-[#BF6D87]">UNDANGI</p>
          <h1 className="font-blush-display mt-5 text-[clamp(3rem,11vw,6.25rem)] font-medium leading-[.9] tracking-[-.045em] text-[#482C34]">{businessConfig.headline}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#482C34] sm:text-lg">{businessConfig.tagline}</p>
          <p className="mt-4 text-base font-bold text-[#BF6D87]">Mulai Rp29.000 — semua tema sudah termasuk semua fitur.</p>
          <div className="mt-6 max-w-xl rounded-2xl border border-[#DD9D7F]/40 bg-white/80 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#BF6D87]">Anti-rugi</p>
            <p className="mt-2 text-sm leading-7 text-[#482C34] sm:text-base">Dibuatin admin dulu, bayar setelah jadi — bayar hanya kalau kamu suka hasilnya.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={businessConfig.whatsapp.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-7 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(72,44,52,.16)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Minta Dibuatin Admin</a>
            <a href="#harga" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#BF6D87]/25 px-7 text-sm font-semibold text-[#BF6D87] transition hover:bg-[#FDF3F1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Lihat Tema</a>
          </div>
          <p className="mt-5 pr-16 text-xs leading-6 text-[#806D70] sm:pr-0">Pembayaran manual via transfer bank / QRIS &bull; Konsultasi gratis via WhatsApp {businessConfig.whatsapp.displayNumber}</p>
        </div>
        <div className="relative mx-auto w-full max-w-[360px] lg:mr-6 lg:max-w-[420px]">
          <div style={demoThemeCssVars(activeTheme) as CSSProperties} className="marketing-preview relative aspect-[9/14] overflow-hidden rounded-[2rem] border-[6px] border-white bg-[var(--w-dark)] shadow-[0_30px_80px_rgba(72,44,52,.22)]">
            <Image src={demoWeddingConfig.assets.hero} alt={`Preview undangan digital contoh ${couple}`} fill priority sizes="(max-width: 1024px) 85vw, 420px" className="object-cover object-[50%_62%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--w-dark)]/90 via-transparent to-[var(--w-dark)]/15" />
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#BF6D87]">Contoh Demo — Data Fiktif</span>
            <div className="absolute inset-x-0 bottom-0 p-7 text-center text-white sm:p-9">
              <p className="text-[10px] tracking-[.28em] text-[var(--w-gold)]">THE WEDDING OF</p>
              <p style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-5xl leading-none sm:text-6xl">{couple}</p>
              <p className="mt-4 text-[10px] tracking-[.18em] text-white/70">TEMA {activeTheme.name.toUpperCase()} — RP{activeTheme.amount.toLocaleString("id-ID")}</p>
            </div>
          </div>
          {/* Kartu "KEPADA YTH." sengaja di alur normal (bukan absolute di
              bawah wrapper): versi absolute sebelumnya menutupi teks
              keterangan pratinjau di bawahnya di HP. -mt-8 tetap membuatnya
              menumpang tepi bawah pratinjau, tapi keterangan di bawahnya
              kini terdorong ke bawah dan tidak pernah tertutup. */}
          <div className="relative z-10 -mt-8 ml-2 w-fit rounded-2xl border border-[#DD9D7F]/30 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:ml-0">
            <p className="text-[9px] font-bold tracking-[.18em] text-[#BF6D87]">KEPADA YTH.</p><p className="font-blush-display mt-1 text-xl text-[#482C34]">Tamu Undangan</p>
          </div>
          <p className="mt-8 text-center text-xs leading-5 text-[#806D70]" aria-live="polite">Pratinjau tema aktif: {activeTheme.name} — ganti temanya di bawah, pratinjau ini ikut berubah.</p>
        </div>
      </div>
    </section>

    <section id="harga" className="scroll-mt-20 bg-[#FDF3F1] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <SectionIntro eyebrow="Harga" title={businessConfig.pricing.title} copy="Lima tema, satu undangan contoh yang sama. Pilih warna atau tingkat desain, lihat pratinjaunya, lalu pesan tema yang kamu suka." centered />
        <p className="mx-auto mt-4 max-w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-[#BF6D87]">Diskon Awal sampai 31 Desember 2026</p>
        <p className="mt-4 text-center text-sm leading-7 text-[#665457]">Semua tema sudah termasuk semua fitur: {businessConfig.pricing.featuresIncluded.join(", ")}. Perbedaan harga hanya pada desain tema.</p>

        {/* Swatch warna: satu lingkaran per tema, memakai warna utama tema itu.
            Klik mengganti tema aktif (hero + kartu) langsung tanpa reload.
            Tema aktif ditandai cincin — pola pemilih visual dari /demo. */}
        <div role="group" aria-label="Pilih tema berdasarkan warna" className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {demoThemes.map((option) => {
            const active = option.slug === activeTheme.slug;
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => selectTheme(option)}
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
          Tema aktif: {activeTheme.name} — Rp{activeTheme.amount.toLocaleString("id-ID")}
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
            dengan huruf display tema, tombol mini) — bukan tangkapan layar.
            Harga asli dari business-config lewat demoThemes. */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleThemes.map((theme) => {
            const viewing = theme.slug === activeTheme.slug;
            return (
              <article key={theme.slug} className="flex flex-col overflow-hidden rounded-3xl border border-[#BF6D87]/15 bg-white shadow-sm">
                <div style={demoThemeCssVars(theme) as CSSProperties} className="bg-[var(--w-dark)] px-4 py-8 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[var(--w-gold)]">The Wedding Of</p>
                  <p style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-3xl leading-tight text-[var(--w-soft-white)]">Fajar &amp; Kirana</p>
                  <p className="mt-1 text-xs tracking-[.2em] text-[var(--w-soft-white)]/75">13 . 06 . 2027</p>
                  <a href={`/demo?tema=${theme.slug}`} className="mt-4 inline-flex min-h-9 items-center rounded-full bg-[var(--w-primary)] px-4 text-xs font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Buka Undangan
                  </a>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#BF6D87]">Tema {theme.name}</p>
                    {viewing && <span className="rounded-full bg-[#BF6D87] px-2 py-1 text-[10px] font-bold text-white">Sedang dilihat</span>}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#DD9D7F]">{theme.tier}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#665457]">{theme.description}</p>
                  <p className="mt-3 text-sm text-[#806D70]"><span className="line-through">Rp{theme.originalAmount.toLocaleString("id-ID")}</span> <span className="ml-2 rounded-full bg-[#BF6D87] px-2 py-1 text-[10px] font-bold text-white">-{theme.discountPercent}%</span></p>
                  <p className="font-blush-display mt-2 text-4xl text-[#482C34]">Rp{theme.amount.toLocaleString("id-ID")}</p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button type="button" onClick={() => chooseTheme(theme)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Pilih {theme.name}</button>
                    <a href={`/demo?tema=${theme.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#BF6D87]/25 px-5 text-sm font-semibold text-[#BF6D87] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Lihat Demo</a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs leading-6 text-[#806D70]">{businessConfig.pricing.note}</p>
      </div>
    </section>

    <section id="acara" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <SectionIntro eyebrow="Untuk berbagai momen" title="Pilih jenis acaramu" copy="Klik jenis acaramu — pilihanmu langsung terisi di formulir pemesanan di bawah." centered />
        <EventTypePicker />
        <p className="mt-8 text-center text-sm text-[#7B686B]">dan berbagai acara lainnya.</p>
        <p className="mt-3 text-center text-sm leading-6 text-[#665457]">Pelajari tiap acara: <a href="/acara/pernikahan" className="font-semibold text-[#BF6D87] underline underline-offset-4 hover:text-[#482C34]">Pernikahan</a> · <a href="/acara/khitanan" className="font-semibold text-[#BF6D87] underline underline-offset-4 hover:text-[#482C34]">Khitanan</a> · <a href="/acara/aqiqah" className="font-semibold text-[#BF6D87] underline underline-offset-4 hover:text-[#482C34]">Aqiqah</a> — termasuk data apa saja yang perlu disiapkan.</p>
      </div>
    </section>

    <section id="contoh" className="scroll-mt-20 bg-[#FDF3F1] py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:px-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(72,44,52,.12)]">
          <Image src={demoWeddingConfig.assets.divider} alt={`Contoh undangan digital ${couple}`} fill sizes="(max-width: 768px) 90vw, 480px" className="object-cover" />
          <span className="absolute left-4 top-4 rounded-full bg-[#FDF3F1]/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#BF6D87]">Contoh Demo — Data Fiktif</span>
        </div>
        <div>
          <SectionIntro eyebrow="Lihat contoh undangan" title={couple} copy="Satu undangan contoh yang sama dalam lima tema — ini contoh fiktif, bukan undangan pelanggan. Lihat langsung bagaimana tema mengubah tampilannya." />
          <p className="mt-5 text-sm font-semibold text-[#BF6D87]">Tema {activeTheme.name} — Rp{activeTheme.amount.toLocaleString("id-ID")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={`/demo?tema=${activeTheme.slug}`} className="inline-flex min-h-12 items-center rounded-full bg-[#BF6D87] px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Lihat Demo</a>
            <a href="/demo" className="inline-flex min-h-12 items-center rounded-full border border-[#BF6D87]/25 px-7 text-sm font-semibold text-[#BF6D87] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Bandingkan 5 Tema</a>
          </div>
          <div className="mt-8 border-l-2 border-[#DD9D7F] pl-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#BF6D87]">Personalisasi tamu</p><p className="font-blush-display mt-2 text-2xl text-[#482C34]">Kepada Yth. Tamu Undangan</p><p className="mt-2 max-w-lg text-sm leading-6 text-[#665457]">Setiap tamu dapat menerima undangan dengan nama yang dipersonalisasi.</p></div>
        </div>
      </div>
    </section>

    <section id="fitur" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <SectionIntro eyebrow="Bukan sekadar pilih template" title="Disesuaikan untuk kebutuhan acaramu" copy="Tema tersedia dapat digunakan sebagai titik awal. Warna, struktur, section, dan fitur tertentu juga dapat disesuaikan selama secara teknis memungkinkan." />
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{featureGroups.map(({ icon: Icon, title, items }) => <article key={title} className="border-t border-[#DD9D7F]/50 pt-5"><Icon aria-hidden className="size-6 text-[#BF6D87]" strokeWidth={1.6} /><h3 className="font-blush-display mt-4 text-2xl font-semibold text-[#482C34]">{title}</h3><ul className="mt-4 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#665457]"><CheckCircle2 aria-hidden className="mt-1 size-4 shrink-0 text-[#DD9D7F]" />{item}</li>)}</ul></article>)}</div>
      </div>
    </section>

    <section id="cara-kerja" className="scroll-mt-20 bg-[#FDF3F1] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12"><SectionIntro eyebrow="Proses sederhana" title="Cara membuat undangan" centered /><ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([number, title, copy]) => <li key={number} className="border-t border-[#DD9D7F]/55 pt-5"><span className="text-xs font-bold text-[#BF6D87]">{number}</span><h3 className="font-blush-display mt-4 text-2xl font-semibold text-[#482C34]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#665457]">{copy}</p></li>)}</ol></div>
    </section>

    <section id="pesan" className="scroll-mt-20 bg-[#FDF3F1] py-20 sm:py-28"><div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12"><SectionIntro eyebrow="Mulai bersama UNDANGI" title="Kirim kebutuhan acaramu" copy="Isi formulir singkat. Admin akan menghubungi kamu untuk membahas desain, fitur, dan langkah berikutnya. Tidak mau isi formulir? Chat admin lewat WhatsApp — admin yang buatkan dulu, bayar hanya kalau kamu suka hasilnya." centered />
      <ol className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ["1", "Isi formulir", "Jenis acara, nomor WhatsApp, tanggal acara, dan tema."],
        ["2", "Admin menghubungi", "Konfirmasi desain dan total bayar lewat WhatsApp."],
        ["3", "Bayar manual", "Transfer bank atau QRIS — detail pembayaran diberikan admin lewat WhatsApp."],
        ["4", "Undangan dibuat", "Setelah bayar terkonfirmasi, admin buatkan undanganmu."],
      ].map(([number, title, copy]) => <li key={number} className="rounded-3xl border border-[#BF6D87]/15 bg-white p-5 shadow-sm"><span className="text-xs font-bold text-[#BF6D87]">{number}</span><h3 className="mt-2 text-sm font-semibold text-[#482C34]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#665457]">{copy}</p></li>)}</ol>
      <div className="mt-10"><OrderForm /></div></div></section>

    <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8"><SectionIntro eyebrow="Pertanyaan umum" title="Yang sering ditanyakan" centered /><div className="mt-10 divide-y divide-[#BF6D87]/12 border-y border-[#BF6D87]/12">{faqs.map(([question, answer]) => <details key={question} className="group py-1"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-[#482C34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87] sm:text-base">{question}<span aria-hidden className="text-xl font-normal text-[#BF6D87] transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-5 pr-8 text-sm leading-7 text-[#665457]">{answer}</p></details>)}</div></div>
    </section>

    {/* Pita custom — dipindah ke bawah FAQ (dulu di tengah alur jualan dan
        berlatar gelap #482C34 yang terbaca maroon). Sekarang berlatar rose
        #BF6D87 dengan aksen persik, jadi tidak memotong alur jualan. */}
    <section className="bg-[#BF6D87] py-20 text-white sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20 lg:px-12">
        <div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#F2D9D3]">Custom design</p><h2 className="font-blush-display mt-3 text-[clamp(2.75rem,8vw,5rem)] leading-[.95]">Punya konsep sendiri?</h2></div>
        <div><p className="text-base leading-8 text-white/85">Tidak perlu menunggu tema baru. Kirim screenshot, link referensi, contoh desain, atau ceritakan style yang kamu inginkan. UNDANGI dapat menyesuaikan tema, warna, layout, section, animasi, dan kebutuhan fitur sesuai acara.</p><p className="mt-4 text-sm text-[#F2D9D3]">Penyesuaian dilakukan sesuai kebutuhan dan kemungkinan teknis.</p><ContactTrigger className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#BF6D87] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Send aria-hidden size={17} /> Request Desain</ContactTrigger></div>
      </div>
    </section>

    <footer className="bg-[#482C34] px-5 pb-28 pt-14 text-white sm:px-8 sm:py-14"><div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-sm font-bold tracking-[.28em]">UNDANGI</p><p className="font-blush-display mt-3 max-w-md text-3xl leading-tight text-white/90">{businessConfig.headline}</p><p className="mt-4 text-sm text-white/55">Hubungi kami melalui tombol WhatsApp untuk konsultasi.</p></div><nav aria-label="Navigasi footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-white/65 sm:grid-cols-3"><a href="#harga" className="hover:text-white">Tema dan Harga</a><a href="#acara" className="hover:text-white">Jenis Acara</a><a href="#contoh" className="hover:text-white">Contoh</a><a href="#fitur" className="hover:text-white">Fitur</a><a href="#cara-kerja" className="hover:text-white">Cara Kerja</a><a href="#faq" className="hover:text-white">FAQ</a><a href="/acara/pernikahan" className="hover:text-white">Undangan Pernikahan</a><a href="/acara/khitanan" className="hover:text-white">Undangan Khitanan</a><a href="/acara/aqiqah" className="hover:text-white">Undangan Aqiqah</a></nav></div><div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/35">© {new Date().getFullYear()} UNDANGI</div></footer>
    <WhatsAppContact />
  </main>;
}
