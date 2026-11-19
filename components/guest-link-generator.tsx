"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, RotateCcw, UsersRound, UserRound } from "lucide-react";
import { buildGuestLink, formatGuestLinks, parseGuestNames, type GuestLink } from "@/lib/guest-links";
import { StableLink as Link } from "@/components/stable-link";

type Mode = "single" | "bulk";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard tidak tersedia");
}

export function GuestLinkGenerator({ baseUrl, slug, displayName, maxNameLength }: { baseUrl: string; slug: string; displayName: string; maxNameLength: number }) {
  const [mode, setMode] = useState<Mode>("single");
  const [singleName, setSingleName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [links, setLinks] = useState<GuestLink[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const bulkCount = useMemo(() => parseGuestNames(bulkNames).length, [bulkNames]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function selectMode(next: Mode) {
    setMode(next);
    setLinks([]);
    setError("");
  }

  function generateSingle() {
    const name = singleName.trim();
    if (!name) return setError("Masukkan nama tamu terlebih dahulu.");
    if (name.length > maxNameLength) return setError(`Nama tamu maksimal ${maxNameLength} karakter.`);
    setLinks([buildGuestLink(baseUrl, slug, name)]);
    setError("");
  }

  function generateBulk() {
    const names = parseGuestNames(bulkNames);
    if (!names.length) return setError("Masukkan minimal satu nama tamu.");
    const invalid = names.find((name) => name.length > maxNameLength);
    if (invalid) return setError(`Setiap nama maksimal ${maxNameLength} karakter. Periksa: “${invalid}”.`);
    setLinks(names.map((name) => buildGuestLink(baseUrl, slug, name)));
    setError("");
  }

  async function copy(value: string, url?: string) {
    try {
      await copyText(value);
      setCopiedUrl(url ?? null);
      setToast(url ? "Link berhasil disalin." : "Semua link berhasil disalin.");
      window.setTimeout(() => setCopiedUrl(null), 1800);
    } catch { setToast("Link belum dapat disalin. Silakan salin secara manual."); }
  }

  function clear() {
    setSingleName("");
    setBulkNames("");
    setLinks([]);
    setError("");
  }

  return <main className="min-h-screen bg-[#FDF3F1] px-4 py-8 text-[#482C34] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-6xl">
      <header className="flex items-center justify-between"><Link href="/" className="text-sm font-extrabold tracking-[.28em] text-[#482C34] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BF6D87]">UNDANGI</Link><span className="rounded-full bg-[#FBE9E4] px-3 py-1.5 text-xs font-semibold text-[#BF6D87]">{displayName}</span></header>
      <section className="mx-auto mt-12 max-w-2xl text-center sm:mt-16"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#BF6D87]">Link personal</p><h1 className="font-blush-display mt-3 text-[clamp(2.75rem,10vw,5rem)] font-medium leading-none text-[#482C34]">Generator Link Tamu</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#6B595C] sm:text-base">Buat link undangan dengan nama tamu yang dipersonalisasi.</p></section>
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:items-start">
        <section className="rounded-3xl border border-[#BF6D87]/10 bg-white p-5 shadow-[0_16px_50px_rgba(72,44,52,.06)] sm:p-7">
          <div className="grid grid-cols-2 rounded-2xl bg-[#FDF3F1] p-1" role="tablist" aria-label="Mode generator"><button type="button" role="tab" aria-selected={mode === "single"} onClick={() => selectMode("single")} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${mode === "single" ? "bg-white text-[#BF6D87] shadow-sm" : "text-[#756467]"}`}><UserRound aria-hidden size={17} /> Satu Tamu</button><button type="button" role="tab" aria-selected={mode === "bulk"} onClick={() => selectMode("bulk")} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${mode === "bulk" ? "bg-white text-[#BF6D87] shadow-sm" : "text-[#756467]"}`}><UsersRound aria-hidden size={17} /> Banyak Tamu</button></div>
          {mode === "single" ? <div className="mt-6"><label className="block text-sm font-semibold text-[#482C34]">Nama Tamu<input value={singleName} onChange={(event) => { setSingleName(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") generateSingle(); }} maxLength={maxNameLength + 1} placeholder="Contoh: Dikriana" className="mt-2 min-h-12 w-full rounded-xl border border-[#BF6D87]/15 bg-[#FFFFFF] px-4 text-base outline-none focus:border-[#BF6D87] focus:ring-2 focus:ring-[#BF6D87]/10" /></label><p className="mt-2 text-right text-xs text-[#8A797C]">{singleName.trim().length}/{maxNameLength}</p><button type="button" onClick={generateSingle} disabled={!singleName.trim()} className="mt-5 min-h-12 w-full rounded-full bg-[#BF6D87] px-6 text-sm font-bold text-white transition hover:bg-[#A8556E] disabled:cursor-not-allowed disabled:opacity-45">Buat Link</button></div> : <div className="mt-6"><label className="block text-sm font-semibold text-[#482C34]">Daftar Nama Tamu<span className="mt-1 block text-xs font-normal text-[#7B696C]">Satu nama per baris.</span><textarea value={bulkNames} onChange={(event) => { setBulkNames(event.target.value); setError(""); }} rows={9} placeholder={"Wulan Darianti\nDikriana & Keluarga\nKeluarga Pak Dikri"} className="mt-3 w-full resize-y rounded-xl border border-[#BF6D87]/15 bg-[#FFFFFF] p-4 text-base leading-7 outline-none focus:border-[#BF6D87] focus:ring-2 focus:ring-[#BF6D87]/10" /></label><p className="mt-2 text-right text-xs text-[#8A797C]">{bulkCount} nama</p><button type="button" onClick={generateBulk} disabled={!bulkNames.trim()} className="mt-5 min-h-12 w-full rounded-full bg-[#BF6D87] px-6 text-sm font-bold text-white transition hover:bg-[#A8556E] disabled:cursor-not-allowed disabled:opacity-45">Generate Semua</button></div>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button type="button" onClick={clear} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-[#BF6D87] hover:bg-[#FDF3F1]"><RotateCcw aria-hidden size={16} /> Bersihkan</button>
        </section>
        <section aria-live="polite" className="min-h-72 rounded-3xl border border-[#BF6D87]/10 bg-[#FDF3F1] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#BF6D87]">Hasil</p><h2 className="font-blush-display mt-1 text-3xl text-[#482C34]">{links.length ? `${links.length} link dibuat` : "Link tamu akan tampil di sini"}</h2></div>{links.length > 1 && <button type="button" onClick={() => void copy(formatGuestLinks(links))} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#BF6D87]/20 bg-white px-4 text-sm font-semibold text-[#BF6D87]"><Copy aria-hidden size={16} /> Copy Semua</button>}</div>
          {links.length ? <div className="mt-6 space-y-3">{links.map((link, index) => <article key={`${link.url}-${index}`} className="rounded-2xl bg-white p-4 shadow-[0_5px_20px_rgba(72,44,52,.04)]"><p className="font-semibold text-[#482C34]">{link.name}</p><p className="mt-2 break-all text-xs leading-5 text-[#79686B]">{link.url}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void copy(link.url, link.url)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#BF6D87] px-4 text-sm font-semibold text-white">{copiedUrl === link.url ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />} Copy Link</button><a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#BF6D87]/20 px-4 text-sm font-semibold text-[#BF6D87]"><ExternalLink aria-hidden size={16} /> Buka Preview</a></div></article>)}</div> : <div className="grid min-h-52 place-items-center text-center"><div><Link2 aria-hidden className="mx-auto size-8 text-[#B79B9F]" /><p className="mt-3 max-w-sm text-sm leading-6 text-[#79686B]">Masukkan nama tamu, lalu buat link personal yang siap disalin dan dibagikan.</p></div></div>}
        </section>
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-[#8A797C]">Nama yang dimasukkan hanya digunakan untuk membuat link di perangkat ini dan tidak disimpan oleh generator.</p>
    </div>
    {toast && <div role="status" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full bg-[#482C34] px-5 py-3 text-center text-sm font-semibold text-white shadow-xl">{toast}</div>}
  </main>;
}
