import { notFound } from "next/navigation";
import { getAdminWedding } from "@/services/admin-wedding-loader";
import { WeddingInvitation } from "@/components/wedding/wedding-invitation";
import { StableLink as Link } from "@/components/stable-link";
import { ArrowLeft } from "lucide-react";
export const metadata = { title: "Draft Preview — UNDANGI", robots: { index: false, follow: false } };
export default async function DraftPreviewPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; const record = await getAdminWedding(id); if (!record) notFound(); return <div className="fixed inset-0 z-50 overflow-y-auto bg-white"><Link href={`/admin/invitations/${id}`} aria-label="Tutup preview" className="fixed left-3 top-[max(.75rem,env(safe-area-inset-top))] z-[400] grid size-11 place-items-center rounded-full bg-white/95 text-[#482C34] shadow-lg backdrop-blur"><ArrowLeft size={19} /></Link><WeddingInvitation config={record.weddingData} guest="Tamu Undangan" /></div>; }
