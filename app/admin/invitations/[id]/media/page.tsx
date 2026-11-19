import { notFound } from "next/navigation";
import { InvitationEditor } from "@/components/admin/invitation-editor";
import { getAdminWedding } from "@/services/admin-wedding-loader";
export default async function InvitationMediaPage({ params }: { params: Promise<{ id: string }> }) { const record = await getAdminWedding((await params).id); if (!record) notFound(); return <InvitationEditor record={record} workspaceMode="media" />; }
