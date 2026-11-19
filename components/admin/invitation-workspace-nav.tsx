"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const tabs = [
  ["", "Ringkasan"], ["/data", "Data"], ["/media", "Media"], ["/preview", "Preview"],
  ["/rsvp", "RSVP"], ["/wishes", "Ucapan & Doa"], ["/settings", "Pengaturan"],
] as const;

export function InvitationWorkspaceNav({ id }: { id: string }) {
  const pathname = usePathname(); const base = `/admin/invitations/${id}`; const [pending, setPending] = useState<{ href: string; fromPath: string } | null>(null); const pendingHref = pending?.fromPath === pathname ? pending.href : null;
  return <nav aria-label="Navigasi workspace undangan" className="overflow-x-auto border-t border-[#F2D9D3] [scrollbar-width:none]"><div className="flex min-w-max gap-1 px-4 sm:px-6">{tabs.map(([suffix, label]) => { const href = `${base}${suffix}`; const selectedPath = pendingHref || pathname; const active = suffix ? selectedPath.startsWith(href) : selectedPath === base; return <a key={suffix} href={href} onClick={() => setPending({ href, fromPath: pathname })} aria-current={active ? "page" : undefined} className={`relative inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition active:scale-[.98] ${active ? "border-[#BF6D87] text-[#BF6D87]" : "border-transparent text-[#746b6d] hover:text-[#482C34]"}`}>{label}{pendingHref === href && pathname !== href ? <span className="ml-2 size-3 animate-spin rounded-full border-2 border-[#BF6D87]/25 border-t-[#BF6D87]" aria-label="Memuat" /> : null}</a>; })}</div></nav>;
}
