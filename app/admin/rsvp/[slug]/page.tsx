import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-shell";
import { RsvpResults } from "@/components/admin/rsvp-results";
import { listAdminRecipientsForWedding, listAdminRsvpForWedding } from "@/services/admin-rsvp-service";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
export default async function AdminRsvpDetailPage({ params }: { params: Promise<{ slug: string }> }) { const slug = (await params).slug; const [rows, recipients, weddings] = await Promise.all([listAdminRsvpForWedding(slug), listAdminRecipientsForWedding(slug), supabaseCmsAdapter.list()]); const wedding = weddings.find((item) => item.slug === slug && item.status === "published" && item.deletedAt === null); if (!wedding) notFound(); return <AdminPage title="RSVP & Tamu" description={wedding.weddingData.couple.display} actions={<a href="/admin/rsvp" className="inline-flex min-h-11 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold">← Kembali</a>}><RsvpResults weddingId={wedding.id} rows={rows} recipients={recipients} weddings={[{ slug, label: wedding.weddingData.couple.display }]} /></AdminPage>; }
