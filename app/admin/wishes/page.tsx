import { AdminPage } from "@/components/admin/admin-shell";
import { WishesInvitationList } from "@/components/admin/wishes-invitation-list";
import { listAdminWishes } from "@/services/admin-responses-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export default async function AdminWishesPage() {
  const [wishResult, weddingResult] = await Promise.allSettled([
    listAdminWishes(),
    supabaseCmsAdapter.list(),
  ]);
  const wishes = wishResult.status === "fulfilled" ? wishResult.value : [];
  const invitations = weddingResult.status === "fulfilled"
    ? weddingResult.value
      .filter((row) => row.status === "published" && row.deletedAt === null)
      .map((row) => ({
        slug: row.slug,
        label: row.weddingData.couple.display,
        rows: wishes.filter((wish) => wish.weddingSlug === row.slug),
      }))
    : [];

  return (
    <AdminPage title="Ucapan" description="Kelola ucapan dan pesan dari tamu di setiap undangan.">
      {wishResult.status === "rejected" && (
        <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ucapan belum dapat dimuat. Jumlah yang tampil mungkin belum lengkap.
        </p>
      )}
      {weddingResult.status === "rejected" && (
        <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Daftar undangan belum dapat dimuat. Silakan coba lagi.
        </p>
      )}
      <WishesInvitationList items={invitations} />
    </AdminPage>
  );
}
