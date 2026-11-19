"use client";
import { FormEvent, useEffect, useState } from "react";
import { businessConfig } from "@/data/business-config";
import { eventTypes, setEventTypeEvent } from "./event-type-picker";

export const setThemeEvent = "undangi:set-theme";

type CatalogTheme = { id: string; slug: string; name: string };
type CatalogPrice = { theme_id: string; package_id: string; normal_amount: number };
type CatalogListing = { themes: CatalogTheme[]; prices: CatalogPrice[] };

// Fallback statis (dipakai bila /api/catalog belum bisa dimuat): hanya slug,
// tanpa UUID, jadi order tetap terkirim lewat jalur lama (tanpa snapshot katalog).
// Harga fallback diambil dari business-config (harga per tema).
const FALLBACK_THEMES: CatalogTheme[] = businessConfig.pricing.themes.map((theme) => ({ id: "", slug: theme.slug, name: theme.name }));

function formatRupiah(amount: number) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

// Tautan "Pilih Tema Ini" dari halaman demo (/?tema=<slug>#pesan) memilih
// tema itu di form ini. Hanya slug katalog yang dikenal yang diterima;
// slug tak dikenal diabaikan supaya tidak ada tema karangan yang terkirim.
function readTemaParam(): string {
  if (typeof window === "undefined") return "";
  const slug = new URLSearchParams(window.location.search).get("tema") ?? "";
  return businessConfig.pricing.themes.some((theme) => theme.slug === slug) ? slug : "";
}

// Form order singkat (rekomendasi 4): hanya 3 field — jenis acara, nomor
// WhatsApp, tanggal acara — ditambah pilih tema. Nama pemesan tidak lagi
// ditanya di form (API mengisi "Pemesan via WA <nomor>"); email dan catatan
// dihapus — admin menanyakan sisanya lewat WhatsApp. Yang tidak mau isi
// form bisa langsung chat admin lewat tautan "Minta Dibuatin Admin" di bawah.
export function OrderForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [catalog, setCatalog] = useState<CatalogListing>({ themes: FALLBACK_THEMES, prices: [] });
  const [catalogLive, setCatalogLive] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [forcedSlug, setForcedSlug] = useState("");
  const [eventType, setEventType] = useState<string>(eventTypes[0][1]);

  // Preselect tema dari ?tema= (tautan "Pilih Tema Ini" dari /demo).
  useEffect(() => {
    setForcedSlug(readTemaParam());
  }, []);

  // Pemilih jenis acara di landing (#acara) mengisi kolom ini lewat event.
  useEffect(() => {
    const onSetEventType = (event: Event) => {
      const label = (event as CustomEvent<string>).detail;
      if (eventTypes.some(([, name]) => name === label)) setEventType(label);
    };
    window.addEventListener(setEventTypeEvent, onSetEventType);
    return () => window.removeEventListener(setEventTypeEvent, onSetEventType);
  }, []);

  // Tombol "Pilih Tema Ini" di pemilih tema landing (#harga) mengisi kolom
  // tema di sini lewat event — tanpa reload, jadi tidak perlu menunggu
  // ?tema= dibaca ulang saat mount. Hanya slug katalog yang dikenal.
  useEffect(() => {
    const onSetTheme = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail;
      if (businessConfig.pricing.themes.some((theme) => theme.slug === slug)) setForcedSlug(slug);
    };
    window.addEventListener(setThemeEvent, onSetTheme);
    return () => window.removeEventListener(setThemeEvent, onSetTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("catalog unavailable"))))
      .then((data: CatalogListing) => {
        if (cancelled || !Array.isArray(data.themes) || data.themes.length === 0) return;
        setCatalog(data);
        setCatalogLive(true);
        // Bila dibuka lewat ?tema=, pilih tema itu; kalau tidak, tema pertama.
        const wanted = readTemaParam();
        const match = wanted ? data.themes.find((theme) => theme.slug === wanted) : undefined;
        setSelectedThemeId(match?.id ?? data.themes[0].id);
      })
      .catch(() => { /* tetap pakai fallback statis di atas */ });
    return () => { cancelled = true; };
  }, []);

  const selectedTheme = catalog.themes.find((t) => t.id === selectedThemeId) ?? catalog.themes[0];
  // Tema dari ?tema= menang atas pilihan default — juga saat katalog live
  // belum dimuat (fallback memakai slug, bukan UUID).
  const effectiveTheme = forcedSlug ? catalog.themes.find((t) => t.slug === forcedSlug) ?? selectedTheme : selectedTheme;
  // Harga per tema: satu harga untuk semua baris paket tema ini.
  const selectedPrice = catalog.prices.find((pr) => pr.theme_id === effectiveTheme?.id)?.normal_amount;
  const staticTheme = businessConfig.pricing.themes.find((theme) => theme.slug === effectiveTheme?.slug);
  const displayAmount = selectedPrice ?? staticTheme?.amount;
  const displayOriginal = staticTheme?.originalAmount;
  const displayDiscount = staticTheme?.discountPercent;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body: Record<string, string> = {
      customerWhatsapp: String(formData.get("customerWhatsapp") ?? ""),
      // Jual per tema: packageCode diisi slug tema (kolom bebas di orders).
      packageCode: effectiveTheme?.slug ?? "blush-sakura",
      weddingDate: String(formData.get("weddingDate") ?? ""),
      // Jenis acara dicatat di catatan supaya admin langsung tahu acaranya
      // apa (skema order tidak punya kolom jenis acara).
      customerNotes: `Jenis acara: ${eventType}`,
    };
    // Hanya kirim UUID bila katalog live terisi; string kosong dihapus agar
    // validasi zod (uuid opsional) tidak menolaknya.
    if (effectiveTheme?.id) body.themeId = effectiveTheme.id;
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json() as { message?: string; orderNumber?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Pesanan belum dapat dikirim.");
      form.reset();
      setMessage(`${data.message} Nomor pesanan: ${data.orderNumber}`);
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pesanan belum dapat dikirim.");
      setState("error");
    }
  }

  return <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-[#BF6D87]/10 bg-white p-6 shadow-sm sm:p-8">
    <label className="block text-sm font-semibold">Jenis acara
      <select required value={eventType} onChange={(e) => setEventType(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3">
        {eventTypes.map(([, name]) => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold">Nomor WhatsApp
      <input required name="customerWhatsapp" inputMode="tel" maxLength={32} placeholder="08..." className="mt-2 min-h-11 w-full rounded-xl border border-black/10 px-3" />
      <span className="mt-1 block text-xs font-normal leading-5 text-[#806D70]">Admin menghubungimu lewat nomor ini untuk konfirmasi desain dan pembayaran.</span>
    </label>
    <label className="block text-sm font-semibold">Tanggal acara
      <input required type="date" name="weddingDate" className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2" />
    </label>
    <label className="block text-sm font-semibold">Tema
      <select required value={effectiveTheme?.id || effectiveTheme?.slug || ""} onChange={(e) => {
        // Pilihan manual pengguna membatalkan preselect dari ?tema=.
        setForcedSlug("");
        const value = e.target.value;
        const byId = catalog.themes.find((t) => t.id === value);
        if (byId) { setSelectedThemeId(byId.id); return; }
        const bySlug = catalog.themes.find((t) => t.slug === value);
        setSelectedThemeId(bySlug?.id ?? "");
      }} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3">
        {catalog.themes.map((theme) => {
          const livePrice = catalog.prices.find((pr) => pr.theme_id === theme.id)?.normal_amount;
          const staticPrice = businessConfig.pricing.themes.find((s) => s.slug === theme.slug)?.amount;
          const price = livePrice ?? staticPrice;
          return <option key={theme.slug} value={theme.id || theme.slug}>{theme.name}{price ? ` — ${formatRupiah(price)}` : ""}</option>;
        })}
      </select>
    </label>
    {effectiveTheme && <p className="text-sm text-[#665457]">
      Tema {effectiveTheme.name} — {displayAmount ? formatRupiah(displayAmount) : ""}{displayOriginal ? <> <span className="line-through text-[#806D70]">{formatRupiah(displayOriginal)}</span> <span className="font-semibold text-[#BF6D87]">Diskon Awal -{displayDiscount}% sampai 31 Des 2026</span></> : ""}
      {!catalogLive && " (harga katalog live belum dimuat — pilihan tetap terkirim)"}
    </p>}
    <p className="text-xs leading-6 text-[#806D70]">Semua tema sudah termasuk semua fitur: {businessConfig.pricing.featuresIncluded.join(", ")}. Perbedaan harga hanya pada desain tema.</p>
    {message && <p role={state === "error" ? "alert" : "status"} className={state === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p>}
    <button disabled={state === "loading"} className="min-h-12 w-full rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white disabled:opacity-60">{state === "loading" ? "Mengirim…" : "Kirim Permintaan Pesanan"}</button>
    <p className="text-center text-sm leading-6 text-[#665457]">Tidak mau isi formulir? <a href={businessConfig.whatsapp.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#BF6D87] underline underline-offset-4 hover:text-[#482C34]">Minta dibuatin admin lewat WhatsApp</a> — admin yang buatkan dulu, bayar hanya kalau kamu suka hasilnya.</p>
  </form>;
}
