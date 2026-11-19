import { AdminPage } from "@/components/admin/admin-shell";
import { InvitationTable } from "@/components/admin/invitation-table";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export default async function InvitationsPage() {
  const result = await supabaseCmsAdapter.list().then((rows) => ({ rows, failed: false })).catch(() => ({ rows: [], failed: true }));
  return <AdminPage title="Undangan" description="Cari, preview, dan kelola seluruh undangan." actions={<a href="/admin/invitations/new" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#BF6D87] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(191,109,135,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(191,109,135,.4)] active:translate-y-0">+ Buat Undangan</a>}>{result.failed && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Daftar undangan belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p>}<InvitationTable rows={result.rows} /></AdminPage>;
}
