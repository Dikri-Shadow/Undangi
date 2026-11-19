"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Search, UserRound, UsersRound, XCircle } from "lucide-react";
import type { AdminRsvpRecord } from "@/types/cms";
import type { AdminRecipientSummary } from "@/services/admin-rsvp-service";
import { buildRsvpCsv, buildWhatsAppReport, calculateRsvpStats } from "@/lib/rsvp-report";
import { AttendanceBadge, EmptyState, StatCard } from "@/components/admin/admin-ui";

type Filter = "semua" | "hadir" | "tidak";

export function RsvpResults({ weddingId, rows, recipients = [], weddings }: { weddingId?: string; rows: AdminRsvpRecord[]; recipients?: AdminRecipientSummary[]; weddings: Array<{ slug: string; label: string }> }) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recipientError, setRecipientError] = useState("");
  const [query, setQuery] = useState("");
  const [attendance, setAttendance] = useState<Filter>("semua");
  const [wedding, setWedding] = useState("semua");
  const labels = useMemo(() => new Map(weddings.map((item) => [item.slug, item.label])), [weddings]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");
    return rows.filter((row) => (attendance === "semua" || row.attendance === attendance) && (wedding === "semua" || row.weddingSlug === wedding) && (!needle || `${row.guestName} ${row.message ?? ""} ${labels.get(row.weddingSlug) ?? row.weddingSlug}`.toLocaleLowerCase("id-ID").includes(needle)));
  }, [attendance, labels, query, rows, wedding]);
  const reportStats = calculateRsvpStats(rows, recipients);
  const stats = { responses: reportStats.responses, attending: reportStats.attending, guests: reportStats.guests, declined: reportStats.declined };
  function exportRows(kind: "csv" | "xls") {
    const headers = ["Nama tamu", "Kehadiran", "Jumlah tamu", "Pesan tambahan", "Waktu pengiriman"];
    const values = visible.map((row) => [row.guestName, row.attendance === "hadir" ? "Hadir" : "Tidak hadir", row.guestCount, row.message || "", new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(row.createdAt))]);
    const content = kind === "csv" ? buildRsvpCsv(visible) : `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${values.map((line) => `<tr>${line.map((value) => `<td>${String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const blob = new Blob([kind === "csv" ? `\uFEFF${content}` : `<html><meta charset="utf-8"><body>${content}</body></html>`], { type: kind === "csv" ? "text/csv;charset=utf-8" : "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `rsvp-${weddings.length === 1 ? weddings[0].slug : "undangan"}.${kind}`; anchor.click(); URL.revokeObjectURL(url);
  }

  const pending = reportStats.pending;
  const report = buildWhatsAppReport(weddings[0]?.label ?? "Undangan", reportStats);
  function copyReport() { void navigator.clipboard?.writeText(report); }
  async function saveRecipient() {
    const name = recipientName.trim();
    if (!weddingId || !name || name.length > 120) { setRecipientError("Nama tamu wajib diisi dan maksimal 120 karakter."); return; }
    setBusy(true); setRecipientError("");
    try { const response = await fetch(`/api/admin/weddings/${weddingId}/recipients`, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { recipientId: editingId, guestName: name } : { guestName: name }) }); if (!response.ok) throw new Error("Gagal menyimpan recipient."); setRecipientName(""); setEditingId(null); router.refresh(); } catch (error) { setRecipientError(error instanceof Error ? error.message : "Gagal menyimpan recipient."); } finally { setBusy(false); }
  }
  async function deleteRecipient(id: string) { if (!weddingId || !window.confirm("Hapus recipient ini? Riwayat RSVP yang sudah ada tetap dipertahankan.")) return; setBusy(true); setRecipientError(""); try { const response = await fetch(`/api/admin/weddings/${weddingId}/recipients`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId: id }) }); if (!response.ok) throw new Error("Gagal menghapus recipient."); router.refresh(); } catch (error) { setRecipientError(error instanceof Error ? error.message : "Gagal menghapus recipient."); } finally { setBusy(false); } }
  return <>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={CalendarDays} label="Total respons" value={stats.responses} />
      <StatCard icon={CheckCircle2} label="Akan hadir" value={stats.attending} />
      <StatCard icon={UsersRound} label="Perkiraan tamu" value={stats.guests} />
      <StatCard icon={XCircle} label="Tidak hadir" value={stats.declined} />
      <StatCard icon={UsersRound} label="Belum merespons" value={pending} />
    </section>
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#F2D9D3] bg-white shadow-[0_1px_3px_rgba(72,44,52,.05),0_10px_28px_rgba(72,44,52,.05)]"><div className="border-b border-[#F2D9D3] p-4"><h2 className="font-bold">Daftar tamu</h2><p className="mt-1 text-sm text-[#746b6d]">Recipient aktif dan status RSVP.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Nama recipient" maxLength={120} className="min-h-11 flex-1 rounded-xl border border-black/10 px-3 text-sm" /><button type="button" disabled={busy} onClick={() => void saveRecipient()} className="min-h-12 rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white disabled:opacity-50 shadow-[0_8px_20px_rgba(191,109,135,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(191,109,135,.4)] active:translate-y-0">{editingId ? "Simpan perubahan" : "Tambah recipient"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setRecipientName(""); }} className="min-h-11 rounded-xl border border-black/10 px-4 text-sm font-semibold">Batal</button>}</div>{recipientError && <p role="alert" className="mt-2 text-sm text-red-700">{recipientError}</p>}</div>{recipients.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#FDF3F1] text-xs font-semibold uppercase tracking-[.08em] text-[#81777a]"><tr><th className="px-5 py-3">Nama tamu</th><th className="px-4 py-3">Status RSVP</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Pesan</th><th className="px-5 py-3">Aksi</th></tr></thead><tbody>{recipients.map((item) => <tr key={item.id} className="border-t border-[#F2D9D3]"><td className="px-5 py-4 font-semibold">{item.guestName}</td><td className="px-4 py-4">{item.rsvp ? <AttendanceBadge value={item.rsvp.attendance} /> : <span className="text-[#81777a]">Belum merespons</span>}</td><td className="px-4 py-4">{item.rsvp?.attendance === "hadir" ? item.rsvp.guestCount : "—"}</td><td className="px-4 py-4 text-[#675e60]">{item.rsvp?.message || "—"}</td><td className="flex gap-2 px-5 py-4"><button type="button" onClick={() => { setEditingId(item.id); setRecipientName(item.guestName); }} className="text-xs font-semibold text-[#BF6D87]">Edit</button><button type="button" disabled={busy} onClick={() => void deleteRecipient(item.id)} className="text-xs font-semibold text-red-700 disabled:opacity-50">Hapus</button></td></tr>)}</tbody></table></div> : <EmptyState icon={UsersRound} title="Belum ada recipient aktif" description="Tambahkan tamu dengan link personal di atas." />}</section>
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#F2D9D3] bg-white shadow-[0_1px_3px_rgba(72,44,52,.05),0_10px_28px_rgba(72,44,52,.05)]">
      <div className="grid gap-3 border-b border-[#F2D9D3] p-4 md:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label className="relative"><span className="sr-only">Cari nama atau pesan RSVP</span><Search aria-hidden size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#857c7e]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau pesan…" className="min-h-11 w-full rounded-xl border border-black/10 bg-[#FDF3F1] pl-10 pr-3 text-sm outline-none focus:border-[#BF6D87] focus:ring-2 focus:ring-[#BF6D87]/10" /></label>
        <select aria-label="Filter undangan" value={wedding} onChange={(event) => setWedding(event.target.value)} className="min-h-11 rounded-xl border border-black/10 bg-[#FDF3F1] px-3 text-sm outline-none focus:border-[#BF6D87]"><option value="semua">Semua undangan</option>{weddings.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select>
        <div className="flex rounded-xl bg-[#FBE9E4] p-1" role="group" aria-label="Filter kehadiran">{(["semua", "hadir", "tidak"] as const).map((item) => <button type="button" key={item} onClick={() => setAttendance(item)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${attendance === item ? "bg-white text-[#482C34] shadow-sm" : "text-[#746b6d]"}`}>{item === "semua" ? "Semua" : item === "hadir" ? "Hadir" : "Tidak hadir"}</button>)}</div>
        <div className="flex flex-wrap gap-2 md:col-span-3 md:justify-end"><button type="button" onClick={copyReport} className="min-h-10 rounded-xl border border-black/10 px-3 text-xs font-semibold">Salin laporan WhatsApp</button><button type="button" onClick={() => exportRows("csv")} disabled={!visible.length} className="min-h-10 rounded-xl border border-black/10 px-3 text-xs font-semibold disabled:opacity-50">Unduh CSV</button><button type="button" onClick={() => exportRows("xls")} disabled={!visible.length} className="min-h-10 rounded-xl border border-black/10 px-3 text-xs font-semibold disabled:opacity-50">Unduh Excel</button></div>
      </div>
      {visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-[#FDF3F1] text-xs font-semibold uppercase tracking-[.08em] text-[#81777a]"><tr><th className="px-5 py-3">Tamu</th><th className="px-4 py-3">Undangan</th><th className="px-4 py-3">Kehadiran</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Pesan</th><th className="px-5 py-3">Dikirim</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id} className="border-t border-[#F2D9D3] align-top hover:bg-[#FDF3F1]"><td className="px-5 py-4 font-semibold text-[#482C34]">{row.guestName}</td><td className="px-4 py-4"><p className="font-medium text-[#482C34]">{labels.get(row.weddingSlug) ?? row.weddingSlug}</p><p className="mt-0.5 font-mono text-xs text-[#857c7e]">/{row.weddingSlug}</p></td><td className="px-4 py-4"><AttendanceBadge value={row.attendance} /></td><td className="px-4 py-4 tabular-nums text-[#482C34]">{row.attendance === "hadir" ? row.guestCount : "—"}</td><td className="max-w-xs px-4 py-4 text-sm leading-6 text-[#675e60]">{row.message || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-[#675e60]">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(row.createdAt))}</td></tr>)}</tbody></table></div> : <div className="px-6 py-14 text-center"><UserRound aria-hidden className="mx-auto size-7 text-[#a39598]" /><p className="mt-3 font-semibold">Belum ada konfirmasi kehadiran untuk undangan ini.</p><p className="mt-1 text-sm text-[#746b6d]">Respons RSVP akan tampil di sini setelah tamu mengirim konfirmasi.</p></div>}
    </section>
  </>;
}
