import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = { title: "Admin — UNDANGI", robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="min-h-screen bg-[#FDF3F1] font-blush-body text-[#482C34] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <AdminSidebar />
    <div className="min-w-0">{children}</div>
  </div>;
}
