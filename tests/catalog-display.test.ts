import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { businessConfig } from "../data/business-config";
import { createOrderSchema } from "../lib/order-validation";
import { calculateFinalAmount } from "../lib/catalog-pricing";

const repoRoot = process.cwd();
function read(...parts: string[]) {
  return readFileSync(join(repoRoot, ...parts), "utf8");
}

test("launch pricing is per theme (29k/29k/49k/49k/99k), same features for all themes", () => {
  assert.equal(businessConfig.pricing.themes.length, 5);
  for (const theme of businessConfig.pricing.themes) {
    assert.ok(theme.amount > 0 && theme.originalAmount > theme.amount);
    assert.ok(theme.discountPercent > 0 && theme.discountPercent < 100);
    assert.equal(calculateFinalAmount(theme.originalAmount), theme.originalAmount);
  }
  assert.deepEqual(
    businessConfig.pricing.themes.map((theme) => theme.amount),
    [29000, 29000, 49000, 49000, 99000],
  );
  // Urutan tampil: harga naik mengikuti kerumitan desain (simpel -> mewah).
  const amounts = businessConfig.pricing.themes.map((theme) => theme.amount);
  assert.deepEqual(amounts, [...amounts].sort((a, b) => a - b));
  assert.deepEqual(
    businessConfig.pricing.themes.map((theme) => theme.tier),
    ["Desain simpel", "Desain simpel", "Desain menengah", "Desain menengah", "Desain paling mewah"],
  );
  assert.ok(businessConfig.pricing.featuresIncluded.includes("RSVP + ucapan"));
});

test("order validation accepts a theme-only order with themeId UUID (no packageId)", () => {
  const parsed = createOrderSchema.safeParse({
    customerName: "Pelanggan QA",
    customerWhatsapp: "081234567890",
    packageCode: "blush-sakura",
    themeId: "11111111-1111-4111-8111-111111111111",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.packageId, undefined);
});

test("order validation still accepts a legacy theme+package order", () => {
  const parsed = createOrderSchema.safeParse({
    customerName: "Pelanggan QA",
    customerWhatsapp: "081234567890",
    packageCode: "blush-sakura",
    themeId: "11111111-1111-4111-8111-111111111111",
    packageId: "22222222-2222-4222-8222-222222222222",
  });
  assert.equal(parsed.success, true);
});

test("landing follows sales order: anti-rugi hero + price -> visual themes & prices -> event types -> example -> features -> order -> FAQ", () => {
  const landing = read("components", "marketing", "landing-page.tsx");
  // Pembeli melihat produk dulu sebelum memilih acara (dirombak 2026-11-19).
  const order = ["Anti-rugi", 'id="harga"', 'id="acara"', 'id="contoh"', 'id="fitur"', 'id="pesan"', 'id="faq"'];
  const positions = order.map((marker) => landing.indexOf(marker));
  for (const [i, position] of positions.entries()) assert.ok(position >= 0, `missing landing section: ${order[i]}`);
  for (let i = 1; i < positions.length; i++) assert.ok(positions[i] > positions[i - 1], `landing section out of order: ${order[i]} before ${order[i - 1]}`);
  // Hero anti-rugi + harga di depan: dibuatin admin dulu, bayar hanya kalau
  // suka + CTA WA + harga mulai Rp29.000.
  assert.match(landing, /Dibuatin admin dulu, bayar setelah jadi/);
  assert.match(landing, /Minta Dibuatin Admin/);
  assert.match(landing, /businessConfig\.whatsapp\.url/);
  assert.match(landing, /Mulai Rp29\.000/);
  // Kartu tema visual memakai demoThemes (harga dari business-config) dan
  // pratinjau mini live (variabel CSS tema kartu itu), bukan kartu teks.
  assert.match(landing, /demoThemes\.map/);
  assert.match(landing, /demoThemeCssVars\(theme\)/);
  assert.match(landing, /Rp\{theme\.amount\.toLocaleString/);
  // Swatch warna + pil tingkat ada di landing, bukan cuma di /demo.
  assert.match(landing, /backgroundColor: option\.palette\.primary/);
  assert.match(landing, /demoTierFilters/);
  // Pita "Punya konsep sendiri?" ada di BAWAH FAQ, berlatar rose — bukan
  // pita gelap di tengah alur jualan.
  const customPos = landing.indexOf("Punya konsep sendiri?");
  const faqPos = landing.indexOf('id="faq"');
  assert.ok(customPos > faqPos, "pita custom harus di bawah FAQ");
  assert.match(landing, /bg-\[#BF6D87\] py-20 text-white/);
  assert.doesNotMatch(landing, /bg-\[#482C34\] py-20 text-white/);
});

test("landing sells with the fictional demo only — never the real customer wedding", () => {
  const landing = read("components", "marketing", "landing-page.tsx");
  assert.doesNotMatch(landing, /Vina/i);
  assert.doesNotMatch(landing, /Hendri/i);
  assert.doesNotMatch(landing, /vina-hendri/);
  assert.doesNotMatch(landing, /Luxury Burgundy/i);
  assert.doesNotMatch(landing, /LUXURY BURGUNDY/);
  assert.match(landing, /demoWeddingConfig/);
  assert.match(landing, /Fajar &amp; Kirana/);
  assert.match(landing, /Contoh Demo — Data Fiktif/);
  const page = read("app", "page.tsx");
  assert.doesNotMatch(page, /vina-hendri/);
  assert.doesNotMatch(page, /getPublishedBySlug/);
  assert.doesNotMatch(page, /supabaseCmsAdapter/);
});

test("landing hero caption is never covered and swatch keeps scroll + form in sync (cek HP 2026-11-19)", () => {
  const landing = read("components", "marketing", "landing-page.tsx");
  // Kartu KEPADA YTH. versi absolute -bottom-4 menutupi teks keterangan
  // pratinjau di HP — kartu harus di alur normal (-mt-8), bukan absolute.
  assert.doesNotMatch(landing, /absolute -bottom-4 -left-2/);
  assert.match(landing, /relative z-10 -mt-8 ml-2 w-fit/);
  // Klik swatch: ganti tema di tempat (replaceState, bukan navigasi),
  // kembalikan posisi gulir, dan sinkronkan kolom tema di form order.
  assert.match(landing, /window\.history\.replaceState\(null, "", `\/\?tema=\$\{next\.slug\}`\)/);
  assert.match(landing, /requestAnimationFrame\(\(\) => window\.scrollTo\(0, y\)\)/);
  assert.match(landing, /dispatchEvent\(new CustomEvent<string>\(setThemeEvent, \{ detail: next\.slug \}\)\)/);
});

test("landing contains no invented social proof or policies", () => {
  const landing = read("components", "marketing", "landing-page.tsx");
  // Tidak ada rating bintang / testimoni / statistik palsu.
  assert.doesNotMatch(landing, /1\.400\.000|1,4 juta|2\.800\+ ulasan|rating 5|bintang 5|★|⭐/i);
  assert.doesNotMatch(landing, /Coming Soon/);
  assert.doesNotMatch(landing, /Tema Modern|Tema Minimal/);
  // Tidak ada klaim "5 menit jadi" atau kebijakan refund/masa aktif yang dikarang.
  assert.doesNotMatch(landing, /5 menit jadi|refund 100%|tanpa masa aktif/i);
  // FAQ masa aktif sudah diputuskan Zeke: 1 tahun. FAQ refund jujur:
  // belum ditetapkan, tanyakan admin.
  assert.match(landing, /Masa aktif undangan adalah 1 tahun/);
  assert.doesNotMatch(landing, /Ketentuan masa aktif belum ditetapkan/);
  assert.match(landing, /Ketentuan pembatalan dan refund belum ditetapkan/);
  // Judul seksi harga diambil dari business-config ("Tema dan Harga",
  // ditegaskan di wedding-validation.test.ts) — bukan teks hardcode.
  assert.match(landing, /businessConfig\.pricing\.title/);
});

test("order form records event type from the landing event picker", () => {
  const form = read("components", "marketing", "order-form.tsx");
  assert.match(form, /Jenis acara/);
  assert.match(form, /setEventTypeEvent/);
  assert.match(form, /Jenis acara: \$\{eventType\}/);
  const picker = read("components", "marketing", "event-type-picker.tsx");
  for (const label of ["Pernikahan", "Ulang Tahun", "Lamaran", "Khitanan", "Aqiqah", "Acara Bisnis"]) {
    assert.ok(picker.includes(label), `event picker missing: ${label}`);
  }
});

test("order validation still accepts the legacy order without catalog IDs", () => {
  const parsed = createOrderSchema.safeParse({
    customerName: "Pelanggan QA",
    customerWhatsapp: "081234567890",
    packageCode: "blush-sakura",
  });
  assert.equal(parsed.success, true);
});

test("FAQ and order section explain payment clearly: steps, manual transfer/QRIS via WA, 1-year validity, refund undecided", () => {
  const landing = read("components", "marketing", "landing-page.tsx");
  // Cara bayar: langkah-langkahnya tertulis jelas, dan detail pembayaran
  // diberikan admin lewat WA (tidak ada nomor rekening yang dikarang di halaman).
  assert.match(landing, /Bagaimana cara bayarnya\?/);
  assert.match(landing, /transfer bank atau QRIS/);
  assert.match(landing, /nomor rekening dan kode QRIS diberikan admin lewat WhatsApp/);
  assert.match(landing, /Isi formulir/);
  assert.match(landing, /Bayar manual/);
  assert.match(landing, /Undangan dibuat/);
  assert.doesNotMatch(landing, /\b\d{10,16}\b.*rekening|rekening.*\b\d{10,16}\b/i);
  // Masa aktif 1 tahun dipertahankan; refund tetap jujur belum ditetapkan.
  assert.match(landing, /Masa aktif undangan adalah 1 tahun/);
  assert.match(landing, /Ketentuan pembatalan dan refund belum ditetapkan/);
  // Harga per tema tetap tampil di FAQ.
  assert.match(landing, /Sage Klasik Rp29\.000/);
  assert.match(landing, /Emas Tengah Malam Rp99\.000/);
});
