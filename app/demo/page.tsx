import type { Metadata } from "next";
import { DemoExperience } from "@/components/marketing/demo-experience";
import { resolveDemoTheme } from "@/data/demo-themes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ tema?: string }> }): Promise<Metadata> {
  const { tema } = await searchParams;
  const theme = resolveDemoTheme(tema);
  const title = `Contoh Undangan Tema ${theme.name} — Rp${theme.amount.toLocaleString("id-ID")} | UNDANGI`;
  const description = `Lihat contoh undangan digital tema ${theme.name} (${theme.description}) Semua data hanya contoh fiktif.`;
  return {
    title,
    description,
    alternates: { canonical: `https://undangi.my.id/demo?tema=${theme.slug}` },
    openGraph: { title, description, type: "website", locale: "id_ID", url: `https://undangi.my.id/demo?tema=${theme.slug}` },
  };
}

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema } = await searchParams;
  return <DemoExperience initialTheme={resolveDemoTheme(tema)} />;
}
