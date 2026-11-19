import { AdminPage } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/admin-ui";
import { WishesModerationList } from "@/components/admin/wishes-moderation-list";
import { listAdminWishesForWedding } from "@/services/admin-responses-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
import { MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";

export default async function AdminWishesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [wishes, invitations] = await Promise.all([
    listAdminWishesForWedding(slug),
    supabaseCmsAdapter.list(),
  ]);
  const invitation = invitations.find(
    (item) => item.slug === slug && item.status === "published" && item.deletedAt === null,
  );
  if (!invitation) notFound();

  return (
    <AdminPage
      title="Ucapan"
      description={`${invitation.weddingData.couple.display} · /${invitation.slug}`}
      actions={<a href="/admin/wishes" className="inline-flex min-h-10 items-center rounded-xl border border-[#BF6D87]/20 px-4 text-sm font-semibold text-[#BF6D87]">← Kembali</a>}
    >
      <div className="mb-5 rounded-2xl border border-[#F2D9D3] bg-white p-5">
        <p className="text-xs uppercase tracking-[.14em] text-[#81777a]">Total ucapan</p>
        <p className="mt-1 text-2xl font-bold text-[#BF6D87]">{wishes.length}</p>
      </div>
      {wishes.length ? <WishesModerationList initialRows={wishes} slug={slug} /> : <div className="rounded-2xl border border-[#F2D9D3] bg-white"><EmptyState icon={MessageCircle} title="Belum ada ucapan untuk undangan ini" description="Ucapan dari tamu akan tampil di sini setelah masuk." /></div>}
    </AdminPage>
  );
}
