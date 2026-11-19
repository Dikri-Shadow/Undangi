import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WeddingInvitation } from "@/components/wedding/wedding-invitation";
import { getPublishedWedding } from "@/services/cms-wedding-service";

// Photo presentation metadata is edited in the CMS and must never be served
// from a stale route cache after Save.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPublishedWedding(slug);
  if (!config) return {};
  const canonical = `${config.metadata.siteUrl}/${config.slug}`;
  const image = new URL(config.assets.ogImage, config.metadata.siteUrl).toString();
  return {
    title: config.metadata.title,
    description: config.metadata.description,
    alternates: { canonical },
    openGraph: { title: config.metadata.ogTitle, description: config.metadata.ogDescription, type: "website", locale: config.metadata.locale, url: canonical, images: [{ url: image, alt: config.couple.display }] },
    twitter: { card: "summary_large_image", title: config.metadata.ogTitle, description: config.metadata.ogDescription, images: [image] },
  };
}

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getPublishedWedding(slug);
  if (!config) notFound();
  return <WeddingInvitation config={config} guest={config.guest.fallbackName} />;
}
