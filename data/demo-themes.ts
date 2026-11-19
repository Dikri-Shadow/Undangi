import { businessConfig } from "./business-config";

// Palet visual 5 tema katalog untuk halaman demo (/demo). Satu undangan
// contoh yang sama dirender dengan palet yang berbeda — pembeli bisa
// membandingkan tema sebelum membeli. Harga TIDAK didefinisikan ulang di
// sini: amount/originalAmount/discountPercent diambil dari
// business-config.pricing.themes (sumber kebenaran harga per tema).
// Palet sengaja TIDAK membalik terang-gelap: latar konten tetap terang di
// semua tema supaya teks tetap terbaca; yang berubah adalah warna primer,
// gelap (hero/sampul), aksen, emas, dan pasangan huruf.
export type DemoThemePalette = {
  primary: string; dark: string; accent: string; cream: string; gold: string;
  goldSoft: string; softWhite: string; text: string; muted: string; muted2: string;
  goldLight: string; goldPale: string; divider: string; deep: string; muted3: string; muted4: string;
};

export type DemoTheme = {
  slug: string; name: string; tier: string; amount: number; originalAmount: number;
  discountPercent: number; description: string; palette: DemoThemePalette;
  fonts: { display: string; body: string };
};

const palettes: Record<string, DemoThemePalette> = {
  "sage-klasik": {
    primary: "#4F6B4A", dark: "#2F4229", accent: "#6B8F61", cream: "#F1F4EA",
    gold: "#A8A06A", goldSoft: "#C9C49A", softWhite: "#FAFBF7", text: "#26301F",
    muted: "#66705E", muted2: "#4E5847", goldLight: "#D8D3A8", goldPale: "#C4BE8F",
    divider: "#E3E7D8", deep: "#141A10", muted3: "#8A9382", muted4: "#6E7768",
  },
  "terracotta-senja": {
    primary: "#B4552D", dark: "#6B2E18", accent: "#C96F3F", cream: "#FAF0E6",
    gold: "#D9A05B", goldSoft: "#EAC08A", softWhite: "#FFFBF5", text: "#33231A",
    muted: "#7A5B4D", muted2: "#5F463A", goldLight: "#F0CBA0", goldPale: "#E2B878",
    divider: "#EFE0D2", deep: "#1F120B", muted3: "#A08072", muted4: "#86685C",
  },
  "blush-sakura": {
    primary: "#BF6D87", dark: "#482C34", accent: "#D68A9E", cream: "#FDF3F1",
    gold: "#DD9D7F", goldSoft: "#EFC0A8", softWhite: "#FFF9F5", text: "#3A242B",
    muted: "#806D70", muted2: "#665457", goldLight: "#F2C9B4", goldPale: "#E8B49A",
    divider: "#F2D9D3", deep: "#241619", muted3: "#A68E92", muted4: "#8A7378",
  },
  "jakarta-modern": {
    primary: "#1F2937", dark: "#111827", accent: "#4B5563", cream: "#F3F4F6",
    gold: "#9CA3AF", goldSoft: "#D1D5DB", softWhite: "#FFFFFF", text: "#111827",
    muted: "#6B7280", muted2: "#4B5563", goldLight: "#E5E7EB", goldPale: "#D1D5DB",
    divider: "#E5E7EB", deep: "#030712", muted3: "#9CA3AF", muted4: "#6B7280",
  },
  "emas-tengah-malam": {
    primary: "#8C6D1F", dark: "#14100C", accent: "#B8912A", cream: "#F8F2E4",
    gold: "#C9A227", goldSoft: "#E6C87A", softWhite: "#FFF9F5", text: "#2A2113",
    muted: "#6E6252", muted2: "#57493A", goldLight: "#F0D98C", goldPale: "#D9BE6E",
    divider: "#EADFC8", deep: "#000000", muted3: "#A08C66", muted4: "#857452",
  },
};

// Pasangan huruf per tema — memakai font yang sudah dimuat di app/layout.tsx.
const fonts: Record<string, { display: string; body: string }> = {
  "sage-klasik": { display: "var(--font-display)", body: "var(--font-body)" },
  "terracotta-senja": { display: "var(--font-display)", body: "var(--font-body)" },
  "blush-sakura": { display: "var(--font-blush-display)", body: "var(--font-blush-body)" },
  "jakarta-modern": { display: "var(--font-body)", body: "var(--font-body)" },
  "emas-tengah-malam": { display: "var(--font-blush-display)", body: "var(--font-body)" },
};

export const demoThemes: DemoTheme[] = businessConfig.pricing.themes.map((theme) => ({
  slug: theme.slug,
  name: theme.name,
  tier: theme.tier,
  amount: theme.amount,
  originalAmount: theme.originalAmount,
  discountPercent: theme.discountPercent,
  description: theme.description,
  palette: palettes[theme.slug],
  fonts: fonts[theme.slug],
}));

export const DEFAULT_DEMO_THEME_SLUG = "blush-sakura";

/** Kelompok tingkat desain untuk pil filter di pemilih tema /demo —
// diambil dari tier katalog (business-config), BUKAN kategori karangan:
// Simpel = Sage Klasik + Terracotta Senja, Medium = Blush Sakura +
// Jakarta Modern, Mewah = Emas Tengah Malam. */
export type DemoTierGroup = "Simpel" | "Medium" | "Mewah";

export function demoTierGroup(theme: DemoTheme): DemoTierGroup {
  if (theme.tier === "Desain simpel") return "Simpel";
  if (theme.tier === "Desain menengah") return "Medium";
  return "Mewah";
}

export const demoTierFilters: ("Semua" | DemoTierGroup)[] = ["Semua", "Simpel", "Medium", "Mewah"];

/** Tema demo dari slug (?tema=...); slug tak dikenal kembali ke Blush Sakura. */
export function resolveDemoTheme(slug?: string | null): DemoTheme {
  return demoThemes.find((theme) => theme.slug === slug) ?? demoThemes.find((theme) => theme.slug === DEFAULT_DEMO_THEME_SLUG)!;
}

/** Variabel CSS (--w-* + font) yang diterapkan pada pembungkus halaman demo. */
export function demoThemeCssVars(theme: DemoTheme): Record<string, string> {
  const p = theme.palette;
  return {
    "--w-primary": p.primary,
    "--w-dark": p.dark,
    "--w-accent": p.accent,
    "--w-cream": p.cream,
    "--w-gold": p.gold,
    "--w-gold-soft": p.goldSoft,
    "--w-soft-white": p.softWhite,
    "--w-text": p.text,
    "--w-muted": p.muted,
    "--w-muted-2": p.muted2,
    "--w-gold-light": p.goldLight,
    "--w-gold-pale": p.goldPale,
    "--w-divider": p.divider,
    "--w-deep": p.deep,
    "--w-muted-3": p.muted3,
    "--w-muted-4": p.muted4,
    "--font-display": theme.fonts.display,
    "--font-body": theme.fonts.body,
  };
}
