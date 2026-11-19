import type { Metadata } from "next";
import { CustomerGuestManagement } from "@/components/customer/customer-guest-management";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guest Management — UNDANGI", robots: { index: false, follow: false } };

export default async function CustomerGuestManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CustomerGuestManagement slug={(await params).slug} />;
}
