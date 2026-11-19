import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuestLinkGenerator } from "@/components/guest-link-generator";
import { businessConfig } from "@/data/business-config";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Generator Link Tamu — UNDANGI", robots: { index: false, follow: false } };

export default async function GuestLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wedding = await supabaseCmsAdapter.getPublishedBySlug(slug).catch(() => null);
  if (!wedding) notFound();
  return <GuestLinkGenerator baseUrl={businessConfig.siteUrl} slug={wedding.slug} displayName={wedding.couple.display} maxNameLength={wedding.guest.maxLength} />;
}
