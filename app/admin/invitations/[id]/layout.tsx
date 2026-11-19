import { notFound } from "next/navigation";
import { WorkspaceHeader } from "@/components/admin/workspace-header";
import { getAdminWedding } from "@/services/admin-wedding-loader";

export default async function InvitationWorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const record = await getAdminWedding((await params).id); if (!record) notFound();
  return <div className="min-h-[calc(100vh-4rem)] bg-[#FDF3F1] lg:min-h-screen"><WorkspaceHeader record={record} />{children}</div>;
}
