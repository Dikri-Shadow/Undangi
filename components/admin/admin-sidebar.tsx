"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ClipboardCheck, LayoutDashboard, Menu, MessageCircle, ShieldCheck, ShoppingBag, Trash2, Wallet, X } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { WishNotificationBell } from "./wish-notification-bell";
import { isAdminNavItemActive } from "@/lib/admin-navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/rsvp", label: "RSVP", icon: ClipboardCheck },
  { href: "/admin/wishes", label: "Ucapan", icon: MessageCircle },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { href: "/admin/income", label: "Pendapatan", icon: Wallet },
  { href: "/admin/trash", label: "Sampah", icon: Trash2 },
  { href: "/admin/settings/security", label: "Keamanan", icon: ShieldCheck },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Navigasi admin" className="space-y-1.5">{items.map(({ href, label, icon: Icon, exact }) => { const active = isAdminNavItemActive(pathname, href, exact); return <a key={href} href={href} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`flex min-h-12 items-center gap-3.5 rounded-2xl px-3.5 text-sm font-medium transition active:scale-[.99] ${active ? "bg-[#BF6D87] text-white shadow-[0_4px_14px_rgba(191,109,135,.4)]" : "text-[#5d5557] hover:bg-[#FBE9E4] hover:text-[#482C34]"}`}><Icon size={18} aria-hidden />{label}</a>; })}</nav>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Tutup drawer saat pindah halaman, tekan Escape, dan kunci scroll body saat terbuka.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open ]);
  return <>
    <aside className="sticky top-0 z-40 border-b border-[#F2D9D3] bg-[#FFFFFF] lg:h-screen lg:border-b-0 lg:border-r">
      {/* Bar atas HP: hamburger (kiri) + merek + lonceng (kanan atas, di luar menu). */}
      <div className="flex min-h-16 items-center gap-2 px-4 lg:hidden">
        <button type="button" aria-label="Buka menu navigasi" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 shrink-0 place-items-center rounded-xl text-[#482C34] transition hover:bg-[#FBE9E4] active:scale-95"><Menu size={22} aria-hidden /></button>
        <a href="/admin" className="mr-auto rounded-lg px-2 py-2 text-sm font-extrabold tracking-[.2em] text-[#482C34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">UNDANGI</a>
        <WishNotificationBell />
      </div>
      {/* Sidebar PC: tidak berubah (merek + lonceng, nav berlabel, keluar di bawah). */}
      <div className="hidden h-full flex-col px-4 py-5 lg:flex">
        <div className="mb-6 flex items-center justify-between">
          <a href="/admin" className="rounded-lg px-3 py-2 text-sm font-extrabold tracking-[.2em] text-[#482C34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">UNDANGI</a>
          <WishNotificationBell />
        </div>
        <NavList />
        <div className="mt-auto"><div className="mb-3 border-t border-[#F2D9D3]" /><LogoutButton /></div>
      </div>
    </aside>
    {/* Drawer hamburger (HP saja): navigasi lengkap + keluar. */}
    {open && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 animate-[admin-fade-in_.2s_ease-out]" />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#FFFFFF] px-4 py-5 shadow-2xl animate-[admin-drawer-in_.22s_ease-out]">
        <div className="mb-6 flex items-center justify-between">
          <a href="/admin" className="rounded-lg px-3 py-2 text-sm font-extrabold tracking-[.2em] text-[#482C34]">UNDANGI</a>
          <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-xl text-[#5d5557] transition hover:bg-[#FBE9E4] active:scale-95"><X size={22} aria-hidden /></button>
        </div>
        <NavList onNavigate={() => setOpen(false)} />
        <div className="mt-auto"><div className="mb-3 border-t border-[#F2D9D3]" /><LogoutButton /></div>
      </div>
    </div>}
  </>;
}
