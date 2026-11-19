import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Italiana, Manrope, Quicksand } from "next/font/google";
import { weddingConfig } from "@/data/wedding-config";
import { businessConfig } from "@/data/business-config";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"], style: ["normal", "italic"], display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
// Blush Sakura (landing, dashboard customer, admin) — Cormorant/Manrope di atas
// TETAP dipakai undangan live, jadi font baru ini variabel terpisah.
const blushDisplay = Italiana({ subsets: ["latin"], variable: "--font-blush-display", weight: ["400"], display: "swap" });
const blushBody = Quicksand({ subsets: ["latin"], variable: "--font-blush-body", weight: ["400", "500", "600", "700"], display: "swap" });
const socialImage = new URL(businessConfig.metadata.ogImage, businessConfig.siteUrl).toString();
export const metadata: Metadata = {
  metadataBase: new URL(businessConfig.siteUrl),
  title: businessConfig.metadata.title,
  description: businessConfig.metadata.description,
  alternates: { canonical: businessConfig.metadata.canonicalUrl },
  openGraph: { title: businessConfig.metadata.title, description: businessConfig.metadata.description, type: "website", locale: weddingConfig.metadata.locale, url: businessConfig.metadata.canonicalUrl, images: [{ url: socialImage, alt: businessConfig.brand }] },
  twitter: { card: "summary_large_image", title: businessConfig.metadata.title, description: businessConfig.metadata.description, images: [socialImage] },
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#482C34" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${blushDisplay.variable} ${blushBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
