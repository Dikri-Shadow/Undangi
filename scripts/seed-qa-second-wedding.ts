import { createNewWeddingConfig } from "../data/wedding-config";

const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!rawUrl || !key) {
  throw new Error("DIBATALKAN: URL dan service role key wajib tersedia.");
}

const url = rawUrl.replace(/\/+$/, "");
const target = new URL(url);

if (
  target.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(target.hostname) ||
  target.port !== "54321" ||
  target.pathname !== "/" ||
  target.username ||
  target.password ||
  target.search ||
  target.hash
) {
  throw new Error("DIBATALKAN: hanya Supabase lokal port 54321 yang diizinkan.");
}

const config = createNewWeddingConfig({
  slug: "qa-dummy-2",
  brideName: "Alya",
  groomName: "Raka",
  brideNickname: "Alya",
  groomNickname: "Raka",
});

const row = {
  slug: config.slug,
  status: "draft",
  bride_name: config.bride.shortName,
  bride_full_name: config.bride.fullName,
  groom_name: config.groom.shortName,
  groom_full_name: config.groom.fullName,
  wedding_data: config,
  theme: "luxury-burgundy",
  updated_by: "local-qa-fixture",
};

console.log("Target:", target.origin);
console.log("Slug:", row.slug);
console.log("Status:", row.status);

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
  throw new Error(`Pembuatan fixture gagal (${response.status}): ${await response.text()}`);
}

console.log("Fixture Alya & Raka berhasil dibuat di Supabase lokal.");
