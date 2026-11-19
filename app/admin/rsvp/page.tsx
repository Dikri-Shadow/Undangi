import { AdminPage } from "@/components/admin/admin-shell";
import { RsvpInvitationList } from "@/components/admin/rsvp-invitation-list";
import { listAdminRsvp } from "@/services/admin-rsvp-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export default async function AdminRsvpPage() {
  const [rsvpResult, weddingResult] = await Promise.allSettled([listAdminRsvp(), supabaseCmsAdapter.list()]);
  const rows = rsvpResult.status === "fulfilled" ? rsvpResult.value : [];
  const grouped = (weddingResult.status === "fulfilled" ? weddingResult.value : []).filter((row) => row.status === "published" && row.deletedAt === null).map((row) => ({ slug: row.slug, label: row.weddingData.couple.display, rows: rows.filter((item) => item.weddingSlug === row.slug) }));
  return <AdminPage title="RSVP" description="Kelola konfirmasi kehadiran tamu dari setiap undangan.">
    {rsvpResult.status === "rejected" && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Data RSVP belum dapat dimuat. Silakan coba lagi.</p>}
    <RsvpInvitationList items={grouped} />
  </AdminPage>;
}
