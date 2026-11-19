import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
function read(...parts: string[]) {
  return readFileSync(join(repoRoot, ...parts), "utf8");
}

test("landing header is sticky with a hamburger menu on mobile", () => {
  const header = read("components", "marketing", "marketing-header.tsx");
  // Sticky di atas, tema Blush Sakura.
  assert.match(header, /sticky top-0/);
  assert.match(header, /bg-\[#FDF3F1\]/);
  // Tombol hamburger: ikon garis, area sentuh min 48px, hanya di HP.
  assert.match(header, /min-h-12 min-w-12/);
  assert.match(header, /aria-expanded/);
  assert.match(header, /aria-controls="menu-navigasi"/);
  assert.match(header, /md:hidden/);
  // Menu membuka/menutup saat diklik, menutup saat link diklik / Escape.
  assert.match(header, /useState\(false\)/);
  assert.match(header, /setOpen\(\(value\) => !value\)/);
  assert.match(header, /onClick=\{\(\) => setOpen\(false\)\}/);
  assert.match(header, /Escape/);
  // Menu berisi link ke semua seksi landing yang benar-benar ada.
  for (const href of ["#acara", "#harga", "#contoh", "#fitur", "#cara-kerja", "#faq"]) {
    assert.ok(header.includes(`href: "${href}"`), `header missing nav link ${href}`);
  }
  assert.ok(!header.includes('"#tema"'), "header still links to nonexistent #tema");
  // CTA di menu: WhatsApp admin + Pesan Sekarang.
  assert.match(header, /businessConfig\.whatsapp\.url/);
  assert.match(header, /Minta Dibuatin Admin/);
  assert.match(header, /Pesan Sekarang/);
  // Menu terbuka berada DI ATAS tombol WhatsApp mengambang (z-50).
  assert.match(header, /z-\[60\]/);
  const contact = read("components", "marketing", "whatsapp-contact.tsx");
  assert.match(contact, /z-50/);
  // Navigasi desktop tetap ada (link biasa, tanpa hamburger).
  assert.match(header, /hidden items-center gap-6 md:flex/);
});
