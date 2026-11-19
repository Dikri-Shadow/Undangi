import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { businessConfig } from "@/data/business-config";

// Landing memakai undangan contoh fiktif (Fajar & Kirana) dari
// data/demo-wedding.ts — TIDAK lagi mengambil undangan pelanggan
// dari Supabase. Undangan pelanggan bukan bahan jualan.
const title = "UNDANGI — Undangan Digital Cantik Mulai Rp29.000";
const description = "Pilih tema yang kamu suka, isi formulir singkat, admin yang buatkan undangannya. Dibuatin admin dulu, bayar setelah jadi — bayar hanya kalau kamu suka hasilnya. Mulai Rp29.000.";
const canonical = `${businessConfig.siteUrl}/`;
const socialImage = new URL(businessConfig.metadata.ogImage, businessConfig.siteUrl).toString();

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, type: "website", locale: "id_ID", url: canonical, images: [{ url: socialImage, alt: "UNDANGI" }] },
  twitter: { card: "summary_large_image", title, description, images: [socialImage] },
};

export default function HomePage() {
  return <><MarketingHeader /><LandingPage /></>;
}
