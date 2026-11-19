
import { weddingConfig } from "../data/wedding-config";

const rawUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!rawUrl || !key) {
  throw new Error(
    "SEED DIBATALKAN: URL dan service role key wajib tersedia."
  );
}

const url = rawUrl.replace(/\/+$/, "");
const target = new URL(url);

const isLocalSupabase =
  target.protocol === "http:" &&
  ["127.0.0.1", "localhost"].includes(target.hostname) &&
  target.port === "54321" &&
  (target.pathname === "" || target.pathname === "/") &&
  !target.username &&
  !target.password &&
  !target.search &&
  !target.hash;

if (!isLocalSupabase) {
  throw new Error(
    "SEED DIBATALKAN: hanya boleh dijalankan ke Supabase lokal port 54321."
  );
}

const now = new Date().toISOString();

const row = {
  slug: weddingConfig.slug,
  status: "published",
  bride_name: weddingConfig.bride.shortName,
  bride_full_name: weddingConfig.bride.fullName,
  groom_name: weddingConfig.groom.shortName,
  groom_full_name: weddingConfig.groom.fullName,
  wedding_data: weddingConfig,
  theme: "luxury-burgundy",
  published_at: now,
  updated_at: now,
  updated_by: "seed-script",
};

console.log("Target Supabase lokal:", target.origin);
console.log("Slug fixture:", row.slug);

const response = await fetch(`${url}/rest/v1/weddings`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(row),
});

if (!response.ok) {
  const error = await response.text();
  throw new Error(`Seed gagal (${response.status}): ${error}`);
}

console.log("Fixture Vina & Hendri berhasil dibuat di Supabase lokal.");
