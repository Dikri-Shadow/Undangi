import { CheckCircle2 } from "lucide-react";
import { businessConfig } from "@/data/business-config";
import type { EventPageContent } from "@/data/event-pages";
import { eventPages } from "@/data/event-pages";

// Satu template untuk semua halaman jenis acara (/acara/pernikahan,
// /acara/khitanan, /acara/aqiqah). Isi: intro acara -> checklist data yang
// perlu disiapkan -> strip 5 tema (harga + tautan demo per tema) -> CTA ke
// form order. Tanpa klaim apa pun (rating/testimoni/statistik) — UNDANGI
// belum punya itu.
export function EventPage({ page }: { page: EventPageContent }) {
  const others = eventPages.filter((other) => other.slug !== page.slug);
  return <main className="marketing-page min-h-screen overflow-x-clip bg-[#FDF3F1] font-blush-body text-[#482C34]">
    <section className="border-b border-[#BF6D87]/10 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#BF6D87]">Undangan digital {page.name}</p>
        <h1 className="font-blush-display mt-3 text-[clamp(2.5rem,8vw,4.5rem)] font-medium leading-[.98] tracking-[-.025em] text-[#482C34]">{page.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#665457]">{page.intro}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/#pesan" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-7 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(72,44,52,.16)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Pesan Sekarang</a>
          <a href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#BF6D87]/25 px-7 text-sm font-semibold text-[#BF6D87] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Bandingkan 5 Tema</a>
        </div>
      </div>
    </section>

    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="font-blush-display text-3xl font-medium text-[#482C34] sm:text-4xl">{page.checklistTitle}</h2>
        <p className="mt-4 text-sm leading-7 text-[#665457]">Siapkan data di bawah ini sebelum memesan — makin lengkap datanya, makin cepat admin menyelesaikan undanganmu. Belum punya semuanya? Tidak apa-apa, kirim yang sudah ada dulu, sisanya bisa menyusul lewat WhatsApp.</p>
        <ol className="mt-10 space-y-5">
          {page.checklist.map((item, index) => <li key={item.label} className="flex gap-4">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-[#BF6D87]/10 text-sm font-bold text-[#BF6D87]">{index + 1}</span>
            <div>
              <p className="text-sm font-semibold text-[#482C34] sm:text-base">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#665457]">{item.detail}</p>
            </div>
          </li>)}
        </ol>
      </div>
    </section>

    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <h2 className="font-blush-display text-center text-3xl font-medium text-[#482C34] sm:text-4xl">Tema untuk {page.name}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-[#665457]">Semua tema sudah termasuk semua fitur — perbedaan harga hanya pada desain tema. Klik Lihat Demo untuk melihat contoh undangan dengan tema itu.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businessConfig.pricing.themes.map((theme) => <article key={theme.slug} className="flex flex-col rounded-3xl border border-[#BF6D87]/15 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#BF6D87]">Tema {theme.name}</p>
            <p className="mt-1 text-xs font-semibold text-[#DD9D7F]">{theme.tier}</p>
            <p className="mt-3 text-sm text-[#806D70]"><span className="line-through">Rp{theme.originalAmount.toLocaleString("id-ID")}</span> <span className="ml-2 rounded-full bg-[#BF6D87] px-2 py-1 text-[10px] font-bold text-white">-{theme.discountPercent}%</span></p>
            <p className="font-blush-display mt-2 text-4xl text-[#482C34]">Rp{theme.amount.toLocaleString("id-ID")}</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#665457]">{theme.description}</p>
            <a href={`/demo?tema=${theme.slug}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#BF6D87]/25 px-5 text-sm font-semibold text-[#BF6D87] transition hover:bg-[#BF6D87]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">Lihat Demo</a>
            <a href="/#pesan" className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5">Pilih {theme.name}</a>
          </article>)}
        </div>
        <p className="mt-5 text-center text-xs leading-6 text-[#806D70]">Harga di atas sudah harga Diskon Awal sampai 31 Desember 2026. Masa aktif undangan 1 tahun.</p>
      </div>
    </section>

    <section className="bg-[#482C34] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="font-blush-display text-3xl font-medium leading-tight sm:text-4xl">Siap buat undangan {page.name}?</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/75">Isi formulir singkat — jenis acara, nomor WhatsApp, dan tanggal acara — atau chat admin lewat WhatsApp. Admin yang buatkan undangannya dulu, bayar hanya kalau kamu suka hasilnya.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/#pesan" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FDF3F1] px-7 text-sm font-bold text-[#BF6D87] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Isi Formulir Pemesanan</a>
          <a href={businessConfig.whatsapp.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-7 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Minta Dibuatin Admin</a>
        </div>
        <p className="mt-8 text-sm text-white/55">Acara lain: {others.map((other, index) => <span key={other.slug}>{index > 0 && " · "}<a href={`/acara/${other.slug}`} className="underline underline-offset-4 hover:text-white">{other.name}</a></span>)} · <a href="/" className="underline underline-offset-4 hover:text-white">Beranda</a></p>
      </div>
    </section>
  </main>;
}
