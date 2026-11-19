import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/admin-shell";
import { SecurityForm } from "@/components/admin/security-form";
import { ReauthForm } from "@/components/admin/reauth-form";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";

export default async function SecurityPage() {
  const admin = await requireAdmin();
  const [session, events] = await Promise.all([supabaseAdminAdapter.getSession(admin.sessionId), supabaseAdminAdapter.listEvents().catch(() => [])]);
  const lastLogin = events.find((event) => event.event_type === "login_success" && event.success)?.created_at;
  const displayTime = (value?: string) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "Belum tersedia";
  return <AdminPage eyebrow="SECURITY" title="Keamanan Admin"><section className="rounded-2xl border border-black/5 bg-white p-6"><p className="text-sm text-[#6A565A]">Admin singleton aktif · sesi dilindungi batas waktu</p><p className="mt-1 font-semibold">{admin.email}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-[#FDF3F1] p-4"><dt className="text-[#6A565A]">Status sesi</dt><dd className="mt-1 font-semibold">{session && !session.revoked_at ? "Aktif" : "Tidak aktif"}</dd></div><div className="rounded-xl bg-[#FDF3F1] p-4"><dt className="text-[#6A565A]">Login terakhir</dt><dd className="mt-1 font-semibold">{displayTime(lastLogin)}</dd></div><div className="rounded-xl bg-[#FDF3F1] p-4"><dt className="text-[#6A565A]">Batas idle</dt><dd className="mt-1 font-semibold">30 menit</dd></div><div className="rounded-xl bg-[#FDF3F1] p-4"><dt className="text-[#6A565A]">Maksimum sesi</dt><dd className="mt-1 font-semibold">8 jam</dd></div></dl><div className="mt-5 flex flex-wrap gap-3"><a className="rounded-xl border px-4 py-3 text-sm" href="/admin/settings/security/activity">Aktivitas keamanan</a></div><ReauthForm /><SecurityForm /></section></AdminPage>;
}
