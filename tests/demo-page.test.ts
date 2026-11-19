import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { businessConfig } from "../data/business-config";
import { demoThemes, demoThemeCssVars, demoTierFilters, demoTierGroup, resolveDemoTheme } from "../data/demo-themes";
import { demoWeddingConfig } from "../data/demo-wedding";

const repoRoot = process.cwd();
function read(...parts: string[]) {
  return readFileSync(join(repoRoot, ...parts), "utf8");
}

const themeHexes = ["#6F1D2A", "#3D0F18", "#8B2635", "#FFF9F5", "#F7EFE7", "#C9A66B", "#D9BA82", "#261719", "#684d51", "#563c40", "#E2C48B", "#D7B980", "#e9ddd1", "#9b7a7f", "#7a5b60", "#18070b"];

test("demo themes: 5 themes, same slugs/prices as catalog, visually distinct palettes", () => {
  assert.equal(demoThemes.length, 5);
  assert.deepEqual(demoThemes.map((theme) => theme.slug), businessConfig.pricing.themes.map((theme) => theme.slug));
  assert.deepEqual(demoThemes.map((theme) => theme.amount), [29000, 29000, 49000, 49000, 99000]);
  assert.deepEqual(demoThemes.map((theme) => theme.amount), businessConfig.pricing.themes.map((theme) => theme.amount));
  // Palet harus benar-benar berbeda antar tema (pembeli bisa membedakan).
  const primaries = new Set(demoThemes.map((theme) => theme.palette.primary));
  assert.equal(primaries.size, 5);
  const darks = new Set(demoThemes.map((theme) => theme.palette.dark));
  assert.equal(darks.size, 5);
  // Harga di demo tidak didefinisikan ulang — sama dengan katalog.
  for (const theme of demoThemes) {
    assert.equal(theme.amount, businessConfig.pricing.themes.find((item) => item.slug === theme.slug)!.amount);
  }
  // Slug tak dikenal kembali ke Blush Sakura (default).
  assert.equal(resolveDemoTheme("tidak-ada").slug, "blush-sakura");
  assert.equal(resolveDemoTheme().slug, "blush-sakura");
  assert.equal(resolveDemoTheme("emas-tengah-malam").slug, "emas-tengah-malam");
});

test("demo theme CSS vars cover every wedding variable and fonts", () => {
  for (const theme of demoThemes) {
    const vars = demoThemeCssVars(theme);
    for (const name of ["--w-primary", "--w-dark", "--w-accent", "--w-cream", "--w-gold", "--w-gold-soft", "--w-soft-white", "--w-text", "--w-muted", "--w-muted-2", "--w-gold-light", "--w-gold-pale", "--w-divider", "--w-deep", "--w-muted-3", "--w-muted-4", "--font-display", "--font-body"]) {
      assert.ok(vars[name], `${theme.slug} missing ${name}`);
    }
    assert.match(vars["--w-primary"], /^#[0-9A-Fa-f]{6}$/);
  }
  // Nilai default di :root sama dengan burgundy lama — undangan live tak berubah.
  const globals = read("app", "globals.css");
  assert.match(globals, /--w-primary: var\(--burgundy\)/);
  assert.match(globals, /--w-cream: var\(--cream\)/);
  assert.match(globals, /--w-gold: var\(--gold\)/);
});

test("wedding components use theme variables, no hardcoded palette hex left", () => {
  const files = ["cinematic-divider.tsx", "cinematic-hero.tsx", "closing-section.tsx", "couple-profiles.tsx", "event-details.tsx", "floating-nav.tsx", "floral-mark.tsx", "gallery.tsx", "gift-section.tsx", "invitation-gate.tsx", "love-story.tsx", "music-player.tsx", "quote-section.tsx", "rsvp-section.tsx", "save-the-date.tsx", "section-heading.tsx", "wedding-invitation.tsx", "wishes-section.tsx"];
  for (const file of files) {
    const source = read("components", "wedding", file);
    for (const hex of themeHexes) {
      assert.ok(!source.includes(hex), `${file} still contains hardcoded ${hex}`);
    }
  }
});

test("demo wedding data is clearly fictional and contains no real account data", () => {
  assert.equal(demoWeddingConfig.slug, "demo-contoh");
  assert.notEqual(demoWeddingConfig.slug, "vina-hendri");
  assert.equal(demoWeddingConfig.couple.display, "Fajar & Kirana");
  assert.ok(!JSON.stringify(demoWeddingConfig).includes("Vina"));
  assert.ok(!JSON.stringify(demoWeddingConfig).includes("Hendri"));
  // Tidak ada rekening/e-wallet asli: gift mati dan tanpa akun.
  assert.equal(demoWeddingConfig.gift.enabled, false);
  assert.deepEqual(demoWeddingConfig.gift.accounts, []);
  assert.equal(demoWeddingConfig.music.enabled, false);
  // Tidak ada nomor telepon/nomor rekening di data demo.
  assert.ok(!/0858|0812|08\d{8,}/.test(JSON.stringify(demoWeddingConfig)));
  // Tanggal contoh di masa depan supaya countdown tampil.
  assert.ok(new Date(demoWeddingConfig.weddingDate!) > new Date("2026-11-19"));
  assert.equal(demoWeddingConfig.dateLabel, "13 . 06 . 2027");
});

test("demo page exists, labels the demo, switches theme via ?tema= without reload", () => {
  const page = read("app", "demo", "page.tsx");
  assert.match(page, /resolveDemoTheme/);
  assert.match(page, /DemoExperience/);
  const experience = read("components", "marketing", "demo-experience.tsx");
  assert.match(experience, /Contoh Demo — Data Fiktif/);
  assert.match(experience, /hanya contoh fiktif/);
  assert.match(experience, /replaceState/);
  assert.match(experience, /\/demo\?tema=/);
  assert.match(experience, /demoThemeCssVars/);
  assert.match(experience, /WeddingInvitation/);
  assert.match(experience, /demo/);
  // Mode demo menonaktifkan RSVP/ucapan (tidak ada pengiriman ke DB).
  const invitation = read("components", "wedding", "wedding-invitation.tsx");
  assert.match(invitation, /demo\?: boolean/);
  assert.match(invitation, /RSVP dinonaktifkan di halaman contoh/);
  assert.match(invitation, /Ucapan dinonaktifkan di halaman contoh/);
});

test("demo tab title follows the active theme when switching without reload", () => {
  // Regresi 2026-11-19: setelah ketuk swatch Emas Tengah Malam, isi halaman
  // dan URL sudah benar, tapi judul tab tetap "Contoh Undangan Tema Blush
  // Sakura — Rp49.000" — select() tidak memperbarui document.title.
  // Format judul klien HARUS sama persis dengan judul server di
  // app/demo/page.tsx (generateMetadata) — ambil template dari kedua file
  // dan pastikan identik, supaya keduanya tidak bisa menyimpang diam-diam.
  const page = read("app", "demo", "page.tsx");
  const experience = read("components", "marketing", "demo-experience.tsx");
  const serverTitle = page.match(/`Contoh Undangan Tema [^`]+`/)?.[0];
  const clientTitle = experience.match(/`Contoh Undangan Tema [^`]+`/)?.[0];
  assert.ok(serverTitle, "judul server tidak ditemukan di app/demo/page.tsx");
  assert.ok(clientTitle, "judul klien tidak ditemukan di demo-experience.tsx");
  // Nama variabel boleh beda (server: theme, klien: next) — samakan dulu.
  const normalize = (template: string) => template.replace(/\$\{(?:theme|next)\./g, "${v.");
  assert.equal(normalize(clientTitle), normalize(serverTitle), "format judul klien harus sama persis dengan server");
  // Judul di-set di select() — jadi berlaku untuk bilah demo, swatch, dan
  // "Lihat Demo" di kartu (semuanya lewat select()).
  assert.match(experience, /function select\(next: DemoTheme\) \{/);
  assert.match(experience, /document\.title = `Contoh Undangan Tema \$\{next\.name\} — Rp\$\{next\.amount\.toLocaleString\("id-ID"\)\} \| UNDANGI`;/);
  // Contoh konkret: Emas Tengah Malam harus berjudul Rp99.000.
  assert.equal(resolveDemoTheme("emas-tengah-malam").amount, 99000);
  assert.equal(`Contoh Undangan Tema Emas Tengah Malam — Rp${(99000).toLocaleString("id-ID")} | UNDANGI`, "Contoh Undangan Tema Emas Tengah Malam — Rp99.000 | UNDANGI");
});

test("landing links the demo from theme cards and the example section", () => {
  const landing = read("components", "marketing", "landing-page.tsx");
  assert.match(landing, /\/demo\?tema=\$\{theme\.slug\}/);
  assert.match(landing, /Bandingkan 5 Tema/);
  assert.match(landing, /href="\/demo"/);
  // Duplikasi copy di Tema & Harga sudah digabung jadi satu paragraf.
  assert.doesNotMatch(landing, /Diurutkan dari desain paling simpel/);
  assert.match(landing, /Semua tema sudah termasuk semua fitur/);
  // Footer diberi jarak bawah supaya konten akhir tidak tertutup tombol WA.
  assert.match(landing, /pb-28 pt-14/);
});

test("floating WhatsApp button hides on scroll down and is smaller on mobile", () => {
  const contact = read("components", "marketing", "whatsapp-contact.tsx");
  assert.match(contact, /scrollY/);
  assert.match(contact, /translate-y-24/);
  assert.match(contact, /size-12/);
  assert.match(contact, /sm:size-14/);
  assert.match(contact, /pointer-events-none/);
  // Tombol sembunyi selama hero terlihat (scroll 0) dan saat seksi yang
  // elemennya memanjang sampai tepi kanan (#acara, #harga, #contoh, #pesan,
  // #faq) terlihat — supaya tidak ada teks/tombol yang tertutup di HP.
  assert.match(contact, /pastHero/);
  assert.match(contact, /getElementById\("hero"\)/);
  assert.match(contact, /IntersectionObserver/);
  assert.match(contact, /"acara", "harga", "contoh", "pesan", "faq"/);
  assert.match(contact, /quietZone/);
  const landing = read("components", "marketing", "landing-page.tsx");
  assert.match(landing, /<section id="hero"/);
  assert.match(landing, /<section id="harga"/);
  assert.match(landing, /<section id="contoh"/);
  // Baris pembayaran hero diberi jarak kanan di HP supaya tidak tertutup tombol.
  assert.match(landing, /mt-5 pr-16 text-xs/);
});

test("demo placeholder images are real files, not empty placeholders", () => {
  // Regresi 2026-11-19: ketiga file ini pernah 0 byte karena fetch lama
  // membaca resource.text (kosong untuk biner) alih-alih resource.blob —
  // akibatnya foto sampul demo tidak pernah tampil, hanya alt text-nya.
  // File harus berisi gambar WebP asli (header RIFF....WEBP) berukuran wajar.
  for (const name of ["couple-hero.webp", "couple-editorial.webp", "couple-divider.webp"]) {
    const buf = readFileSync(join(repoRoot, "public", "images", name));
    assert.ok(buf.length > 10000, `${name} harus berisi data gambar, bukan 0 byte (dapat ${buf.length})`);
    assert.equal(buf.subarray(0, 4).toString("latin1"), "RIFF", `${name} harus file RIFF/WebP`);
    assert.equal(buf.subarray(8, 12).toString("latin1"), "WEBP", `${name} harus file WebP`);
  }
  // Foto sampul demo memakai couple-hero.webp (portrait).
  assert.equal(demoWeddingConfig.assets.cover, "/images/couple-hero.webp");
});

test("demo tier groups map catalog tiers without inventing categories", () => {
  assert.equal(demoTierGroup(demoThemes[0]), "Simpel"); // Sage Klasik
  assert.equal(demoTierGroup(demoThemes[1]), "Simpel"); // Terracotta Senja
  assert.equal(demoTierGroup(demoThemes[2]), "Medium"); // Blush Sakura
  assert.equal(demoTierGroup(demoThemes[3]), "Medium"); // Jakarta Modern
  assert.equal(demoTierGroup(demoThemes[4]), "Mewah"); // Emas Tengah Malam
  assert.deepEqual(demoTierFilters, ["Semua", "Simpel", "Medium", "Mewah"]);
});

test("demo theme picker section: swatches, tier pills, live cards, no fake stats", () => {
  const experience = read("components", "marketing", "demo-experience.tsx");
  // Bagian "Pilih Tema" di BAWAH undangan (undangan tetap konten utama di atas).
  const invitationPos = experience.indexOf("<WeddingInvitation");
  const pickerPos = experience.indexOf('id="pilih-tema"');
  assert.ok(invitationPos > -1 && pickerPos > invitationPos, "pemilih tema harus di bawah undangan");
  assert.match(experience, /Pilih Tema/);
  // Swatch: 5 lingkaran memakai warna utama tiap tema, tema aktif bercincin.
  assert.match(experience, /backgroundColor: option\.palette\.primary/);
  assert.match(experience, /boxShadow: active \? `0 0 0 2px #fff, 0 0 0 4px/);
  assert.match(experience, /aria-label=\{`Pilih tema \$\{option\.name\}`\}/);
  // Swatch memakai select() yang sama — ganti instan tanpa reload.
  assert.match(experience, /onClick=\{\(\) => select\(option\)\}/);
  // Pil tingkat: Semua / Simpel / Medium / Mewah; aktif memakai rose Blush Sakura.
  assert.match(experience, /demoTierFilters/);
  assert.match(experience, /bg-\[#BF6D87\] text-white/);
  assert.match(experience, /demoTierGroup\(option\) === filter/);
  // Kartu: pratinjau mini LIVE (variabel CSS tema kartu itu), nama, harga +
  // coret, dan dua aksi. Teks pratinjau memakai huruf display tema.
  assert.match(experience, /demoThemeCssVars\(option\)/);
  assert.match(experience, /Fajar &amp; Kirana/);
  assert.match(experience, /fontFamily: "var\(--font-display\)"/);
  assert.match(experience, /Buka Undangan/);
  assert.match(experience, /Lihat Demo/);
  assert.match(experience, /Pilih Tema Ini/);
  assert.match(experience, /href=\{`\/\?tema=\$\{option\.slug\}#pesan`\}/);
  // "Lihat Demo" mengganti tema lalu menggulir ke atas ke undangan.
  assert.match(experience, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
  // TIDAK ADA: kolom pencarian, angka "kali digunakan"/rating palsu.
  assert.doesNotMatch(experience, /Kali Digunakan/i);
  assert.doesNotMatch(experience, /digunakan/i);
  assert.doesNotMatch(experience, /type="search"/);
  assert.doesNotMatch(experience, /Cari tema/);
  assert.doesNotMatch(experience, /rating/i);
});

test("order form preselects theme from ?tema= (demo 'Pilih Tema Ini')", () => {
  const form = read("components", "marketing", "order-form.tsx");
  assert.match(form, /URLSearchParams/);
  assert.match(form, /get\("tema"\)/);
  assert.match(form, /forcedSlug/);
  // Hanya slug katalog yang dikenal yang diterima.
  assert.match(form, /pricing\.themes\.some/);
  assert.match(form, /theme\.slug === slug/);
  // Tema dari ?tema= dipakai saat katalog live dimuat maupun fallback.
  assert.match(form, /effectiveTheme/);
  assert.match(form, /match\?\.id \?\? data\.themes\[0\]\.id/);
  // Pilihan manual membatalkan preselect.
  assert.match(form, /setForcedSlug\(""\)/);
  // Tombol "Pilih Tema Ini" di landing (#harga) juga mengisi form lewat
  // event — tanpa reload, karena form sudah ter-mount saat tombol diklik.
  assert.match(form, /setThemeEvent/);
  assert.match(form, /undangi:set-theme/);
  const landing = read("components", "marketing", "landing-page.tsx");
  assert.match(landing, /setThemeEvent/);
  assert.match(landing, /chooseTheme\(theme\)/);
});

test("demo gate sits below the sticky demo bar and theme picker wraps", () => {
  const experience = read("components", "marketing", "demo-experience.tsx");
  // Tinggi bilah diukur langsung (berubah per lebar layar dan huruf tema)
  // dan diteruskan sebagai variabel CSS ke sampul.
  assert.match(experience, /useLayoutEffect/);
  assert.match(experience, /ResizeObserver/);
  assert.match(experience, /headerRef/);
  assert.match(experience, /--demo-bar-h/);
  // Pemilih tema membungkus ke baris berikut — semua tema terlihat tanpa
  // geser horizontal dan tanpa terpotong di tepi kanan.
  assert.match(experience, /flex flex-wrap gap-2/);
  assert.doesNotMatch(experience, /overflow-x-auto/);
  // Sampul mode demo memakai offset atas bilah; mode live tetap inset-0.
  const gate = read("components", "wedding", "invitation-gate.tsx");
  assert.match(gate, /demo\?: boolean/);
  assert.match(gate, /top-\[var\(--demo-bar-h,0px\)\]/);
  assert.match(gate, /fixed inset-0 z-\[100\] grid min-h-\[100svh\]/);
  const invitation = read("components", "wedding", "wedding-invitation.tsx");
  assert.match(invitation, /<InvitationGate[^>]*demo=\{demo\}/);
});
