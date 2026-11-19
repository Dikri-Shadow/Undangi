import "server-only";
import { getSupabaseAdminEnv } from "@/lib/supabase-env";
import { calculateFinalAmount, type PriceSnapshot } from "@/lib/catalog-pricing";

type CatalogRow = { id: string; name: string; active: boolean };
type ThemeRow = { id: string; slug: string; name: string; active: boolean };
type PackageRow = { id: string; slug: string; name: string; active: boolean };
type PriceRow = { theme_id: string; package_id: string; normal_amount: number; active: boolean };

export type CatalogListing = {
  themes: ThemeRow[];
  packages: PackageRow[];
  prices: PriceRow[];
};

export async function listCatalog(): Promise<CatalogListing> {
  const env = getSupabaseAdminEnv();
  if (!env) throw new Error("Catalog service unavailable.");
  const headers = { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}` };
  const base = `${env.url}/rest/v1/`;
  const [themeResponse, packageResponse, priceResponse] = await Promise.all([
    fetch(`${base}catalog_themes?active=eq.true&select=id,slug,name,active&order=display_order`, { headers, cache: "no-store" }),
    fetch(`${base}catalog_packages?active=eq.true&select=id,slug,name,active&order=display_order`, { headers, cache: "no-store" }),
    fetch(`${base}theme_package_prices?active=eq.true&select=theme_id,package_id,normal_amount,active`, { headers, cache: "no-store" }),
  ]);
  if (!themeResponse.ok || !packageResponse.ok || !priceResponse.ok) throw new Error("Catalog lookup failed.");
  const themes = (await themeResponse.json()) as ThemeRow[];
  const packages = (await packageResponse.json()) as PackageRow[];
  const prices = (await priceResponse.json()) as PriceRow[];
  return { themes, packages, prices };
}

// Harga jual per tema: satu harga per tema, berlaku untuk semua paket.
// Membaca semua baris harga aktif untuk tema itu dan menuntut semuanya sama;
// kolom paket di snapshot hanya dipertahankan untuk kompatibilitas (admin lama).
export async function resolveThemeSnapshot(themeId: string, discountCode?: string): Promise<PriceSnapshot> {
  const env = getSupabaseAdminEnv();
  if (!env) throw new Error("Catalog service unavailable.");
  const headers = { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}` };
  const base = `${env.url}/rest/v1/`;
  const [themeResponse, priceResponse] = await Promise.all([
    fetch(`${base}catalog_themes?id=eq.${encodeURIComponent(themeId)}&active=eq.true&select=id,name&limit=1`, { headers, cache: "no-store" }),
    fetch(`${base}theme_package_prices?theme_id=eq.${encodeURIComponent(themeId)}&active=eq.true&select=theme_id,package_id,normal_amount`, { headers, cache: "no-store" }),
  ]);
  if (!themeResponse.ok || !priceResponse.ok) throw new Error("Catalog lookup failed.");
  const theme = (await themeResponse.json() as CatalogRow[])[0];
  const priceRows = (await priceResponse.json()) as PriceRow[];
  if (!theme || priceRows.length === 0) throw new Error("Catalog selection unavailable.");
  if (discountCode) throw new Error("Voucher belum tersedia pada alur order ini.");
  // Harga per tema harus tunggal: semua baris paket untuk tema ini harus sama.
  const amounts = [...new Set(priceRows.map((row) => row.normal_amount))];
  if (amounts.length !== 1) throw new Error("Catalog selection unavailable.");
  const amount = amounts[0];
  return { themeId: theme.id, themeName: theme.name, packageId: "", packageName: "Per Tema", normalAmount: amount, finalAmount: calculateFinalAmount(amount), calculatedAt: new Date().toISOString() };
}

export async function resolveCatalogSnapshot(themeId: string, packageId: string, discountCode?: string): Promise<PriceSnapshot> {
  const env = getSupabaseAdminEnv();
  if (!env) throw new Error("Catalog service unavailable.");
  const headers = { apikey: env.serviceRoleKey, Authorization: `Bearer ${env.serviceRoleKey}` };
  const base = `${env.url}/rest/v1/`;
  const [themeResponse, packageResponse, priceResponse] = await Promise.all([
    fetch(`${base}catalog_themes?id=eq.${encodeURIComponent(themeId)}&active=eq.true&select=id,name&limit=1`, { headers, cache: "no-store" }),
    fetch(`${base}catalog_packages?id=eq.${encodeURIComponent(packageId)}&active=eq.true&select=id,name&limit=1`, { headers, cache: "no-store" }),
    fetch(`${base}theme_package_prices?theme_id=eq.${encodeURIComponent(themeId)}&package_id=eq.${encodeURIComponent(packageId)}&active=eq.true&select=theme_id,package_id,normal_amount&limit=1`, { headers, cache: "no-store" }),
  ]);
  if (!themeResponse.ok || !packageResponse.ok || !priceResponse.ok) throw new Error("Catalog lookup failed.");
  const theme = (await themeResponse.json() as CatalogRow[])[0];
  const pack = (await packageResponse.json() as CatalogRow[])[0];
  const price = (await priceResponse.json() as PriceRow[])[0];
  if (!theme || !pack || !price) throw new Error("Catalog selection unavailable.");
  if (discountCode) throw new Error("Voucher belum tersedia pada alur order ini.");
  return { themeId: theme.id, themeName: theme.name, packageId: pack.id, packageName: pack.name, normalAmount: price.normal_amount, finalAmount: calculateFinalAmount(price.normal_amount), calculatedAt: new Date().toISOString() };
}
