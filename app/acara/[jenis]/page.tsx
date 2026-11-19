import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { EventPage } from "@/components/marketing/event-page";
import { eventPages, getEventPage } from "@/data/event-pages";
import { businessConfig } from "@/data/business-config";

// Halaman per jenis acara dari SATU template (EventPage) — hanya data yang
// berbeda per acara (data/event-pages.ts). URL: /acara/pernikahan,
// /acara/khitanan, /acara/aqiqah.
export function generateStaticParams() {
  return eventPages.map((page) => ({ jenis: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ jenis: string }> }): Promise<Metadata> {
  const { jenis } = await params;
  const page = getEventPage(jenis);
  if (!page) return {};
  const canonical = `${businessConfig.siteUrl}/acara/${page.slug}`;
  return {
    title: `${page.title} | UNDANGI`,
    description: page.metaDescription,
    alternates: { canonical },
    openGraph: { title: `${page.title} | UNDANGI`, description: page.metaDescription, type: "website", locale: "id_ID", url: canonical },
  };
}

export default async function EventRoutePage({ params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params;
  const page = getEventPage(jenis);
  if (!page) notFound();
  return <><MarketingHeader basePath="/" /><EventPage page={page} /></>;
}
