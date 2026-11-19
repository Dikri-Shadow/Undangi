import type { LucideIcon } from "lucide-react";

/**
 * Komponen UI admin bersama — satu definisi, dipakai di semua halaman
 * admin dan halaman kelola tamu customer, supaya tampilannya konsisten
 * dan terasa nyaman. Token visual: kartu putih lembut (radius 24px +
 * bayangan halus, bukan kotak kaku), aksen rose #BF6D87, garis
 * #F2D9D3, spacing lega kelipatan 8px.
 */

export function StatCard({ label, value, sub, icon: Icon }: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-[#F2D9D3] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(72,44,52,.05),0_10px_28px_rgba(72,44,52,.05)] sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#81777a] sm:text-xs">{label}</p>
        {Icon ? <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FBE9E4] sm:size-9"><Icon aria-hidden className="size-4 text-[#BF6D87] sm:size-[18px]" /></span> : null}
      </div>
      <p className="mt-2 text-[28px] font-bold leading-8 tabular-nums text-[#482C34] sm:mt-3 sm:text-[32px] sm:leading-9">{value}</p>
      {sub ? <p className="mt-1 text-xs text-[#81777a] sm:mt-1.5">{sub}</p> : null}
    </div>
  );
}

type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";
const badgeTone: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
  neutral: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}

/** Label + warna badge untuk status pesanan (bukan snake_case mentah). */
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    new: { tone: "info", label: "Baru" },
    in_progress: { tone: "warning", label: "Dikerjakan" },
    waiting_customer: { tone: "warning", label: "Menunggu customer" },
    completed: { tone: "success", label: "Selesai" },
    cancelled: { tone: "danger", label: "Dibatalkan" },
  };
  const item = map[status] ?? { tone: "neutral" as BadgeTone, label: status };
  return <StatusBadge tone={item.tone}>{item.label}</StatusBadge>;
}

/** Label + warna badge untuk status pembayaran pesanan. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    unpaid: { tone: "warning", label: "Belum bayar" },
    proof_submitted: { tone: "info", label: "Bukti dikirim" },
    verified: { tone: "success", label: "Terverifikasi" },
    rejected: { tone: "danger", label: "Ditolak" },
  };
  const item = map[status] ?? { tone: "neutral" as BadgeTone, label: status };
  return <StatusBadge tone={item.tone}>{item.label}</StatusBadge>;
}

/** Badge kehadiran RSVP. */
export function AttendanceBadge({ value }: { value: "hadir" | "tidak" }) {
  return (
    <StatusBadge tone={value === "hadir" ? "success" : "neutral"}>
      {value === "hadir" ? "Hadir" : "Tidak hadir"}
    </StatusBadge>
  );
}

/** Badge status undangan (published/draft). */
export function WeddingStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge tone={status === "published" ? "success" : "warning"}>
      {status === "published" ? "Dipublikasikan" : "Draf"}
    </StatusBadge>
  );
}

/** Badge status moderasi ucapan. */
export function ModerationBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    pending: { tone: "warning", label: "Menunggu" },
    approved: { tone: "success", label: "Disetujui" },
    rejected: { tone: "danger", label: "Ditolak" },
  };
  const item = map[status] ?? { tone: "neutral" as BadgeTone, label: status };
  return <StatusBadge tone={item.tone}>{item.label}</StatusBadge>;
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      {Icon ? <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#FBE9E4]"><Icon aria-hidden className="size-7 text-[#BF6D87]" /></span> : null}
      <p className="mt-4 text-base font-semibold text-[#482C34]">{title}</p>
      {description ? <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[#746b6d]">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
