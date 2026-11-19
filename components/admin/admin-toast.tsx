"use client";
import { useEffect } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { toastDurations, type AdminToastState } from "@/lib/admin-toast";

export function AdminToast({ toast, close }: { toast: AdminToastState; close: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(close, toastDurations[toast.kind]);
    return () => window.clearTimeout(timer);
  }, [close, toast]);
  if (!toast) return null;
  const Icon = toast.kind === "success" ? CheckCircle2 : toast.kind === "error" || toast.kind === "warning" ? TriangleAlert : Info;
  return <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[1000] flex justify-center sm:inset-x-auto sm:bottom-5 sm:right-5 sm:justify-end" aria-live={toast.kind === "error" ? "assertive" : "polite"}>
    <div role={toast.kind === "error" ? "alert" : "status"} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-xl animate-in fade-in slide-in-from-bottom-2">
      <Icon className={toast.kind === "error" ? "mt-0.5 size-4 shrink-0 text-red-700" : toast.kind === "success" ? "mt-0.5 size-4 shrink-0 text-emerald-700" : "mt-0.5 size-4 shrink-0 text-amber-700"} />
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button type="button" onClick={close} aria-label="Tutup notifikasi" className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#BF6D87]"><X size={16} /></button>
    </div>
  </div>;
}
