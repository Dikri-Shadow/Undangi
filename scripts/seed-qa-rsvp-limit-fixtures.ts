import { createNewWeddingConfig } from "../data/wedding-config";

const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!rawUrl || !key) throw new Error("DIBATALKAN: URL dan service role key wajib tersedia.");
const url = rawUrl.replace(/\/+$/, "");
const target = new URL(url);
if (target.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(target.hostname) || target.port !== "54321" || target.pathname !== "/" || target.username || target.password || target.search || target.hash) throw new Error("DIBATALKAN: hanya Supabase lokal port 54321 yang diizinkan.");

const fixtures = [
  ["qa-rsvp-limit-2", "QA Limit Dua", "QA Pasangan Dua", 2],
  ["qa-rsvp-limit-5", "QA Limit Lima", "QA Pasangan Lima", 5],
  ["qa-rsvp-limit-10", "QA Limit Sepuluh", "QA Pasangan Sepuluh", 10],
] as const;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const existingResponse = await fetch(`${url}/rest/v1/weddings?slug=in.(${fixtures.map(([slug]) => slug).join(",")})&select=slug,status,deleted_at,wedding_data`, { headers });
if (!existingResponse.ok) throw new Error(`Pemeriksaan fixture gagal (${existingResponse.status}).`);
const existing = await existingResponse.json() as Array<{ slug: string; status: string; deleted_at: string | null; wedding_data: { rsvp?: { maxGuests?: number } } }>;
const existingBySlug = new Map(existing.map((row) => [row.slug, row]));
for (const [slug, brideName, groomName, maxGuests] of fixtures) {
  const current = existingBySlug.get(slug);
  if (current) {
    if (current.status !== "published" || current.deleted_at !== null || current.wedding_data?.rsvp?.maxGuests !== maxGuests) throw new Error(`Fixture ${slug} sudah ada tetapi konfigurasi tidak sesuai; tidak diubah.`);
    continue;
  }
  const config = createNewWeddingConfig({ slug, brideName, groomName, brideNickname: brideName, groomNickname: groomName });
  config.rsvp.maxGuests = maxGuests;
  const row = { slug, status: "published", bride_name: config.bride.shortName, bride_full_name: config.bride.fullName, groom_name: config.groom.shortName, groom_full_name: config.groom.fullName, wedding_data: config, theme: "luxury-burgundy", updated_by: "local-qa-rsvp-limit" };
  const response = await fetch(`${url}/rest/v1/weddings`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (!response.ok) throw new Error(`Pembuatan fixture ${slug} gagal (${response.status}).`);
}
console.log("QA RSVP limit fixtures verified.");
