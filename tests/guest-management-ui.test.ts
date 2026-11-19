import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

test("rsvp section prefills the name from the ?to= guest link", () => {
  const source = read("components", "wedding", "rsvp-section.tsx");
  assert.match(source, /new URLSearchParams\(window\.location\.search\)\.get\("to"\)/);
  assert.match(source, /setName\(to\.trim\(\)/);
  assert.doesNotMatch(source, /from "@\/hooks\/use-personal-recipient"/);
  assert.doesNotMatch(source, /usePersonalRecipient\(\)/);
});

test("rsvp section is rendered inside the personal recipient provider", () => {
  const invitation = read("components", "wedding", "wedding-invitation.tsx");
  assert.match(invitation, /<PersonalRecipientProvider slug=\{config\.slug\}>/);
  assert.match(invitation, /<RsvpSection slug=\{config\.slug\} config=\{config\.rsvp\} \/>/);
  assert.ok(invitation.indexOf("<PersonalRecipientProvider") < invitation.indexOf("<RsvpSection"));
});

test("rsvp section lets the guest edit the prefilled name and submit without a token", () => {
  const source = read("components", "wedding", "rsvp-section.tsx");
  assert.match(source, /placeholder="Nama Anda"/);
  assert.doesNotMatch(source, /readOnly=\{Boolean\(recipient\)\}/);
  assert.doesNotMatch(source, /RSVP hanya bisa diisi lewat link personal/);
  assert.match(source, /disabled=\{status === "loading"\}/);
  assert.doesNotMatch(source, /if \(!recipient \|\| status === "loading"\) return;/);
});

test("rsvp section keeps honeypot, startedAt, and error handling", () => {
  const source = read("components", "wedding", "rsvp-section.tsx");
  assert.match(source, /name="website"/);
  assert.match(source, /startedAt: startedAt\.current/);
  assert.match(source, /role="alert"/);
});

test("guest management exports CSV as a downloadable blob", () => {
  const source = read("components", "customer", "customer-guest-management.tsx");
  assert.match(source, /\/api\/customer\/\$\{encodeURIComponent\(slug\)\}\/recipients\/export\?format=csv/);
  assert.match(source, /credentials: "include"/);
  assert.match(source, /URL\.createObjectURL\(blob\)/);
  assert.match(source, /Unduh CSV/);
  assert.match(source, /anchor\.download = `tamu-\$\{slug\}\.csv`/);
});

test("guest management copies the WhatsApp report to the clipboard", () => {
  const source = read("components", "customer", "customer-guest-management.tsx");
  assert.match(source, /\/api\/customer\/\$\{encodeURIComponent\(slug\)\}\/recipients\/export\?format=whatsapp/);
  assert.match(source, /navigator\.clipboard\?\.writeText\(text\)/);
  assert.match(source, /Salin laporan WA/);
  assert.match(source, /Laporan tersalin/);
});

test("guest management export errors reuse the link error pattern", () => {
  const source = read("components", "customer", "customer-guest-management.tsx");
  assert.match(source, /setLinkError\("Gagal mengunduh CSV\. Coba lagi\."\)/);
  assert.match(source, /setLinkError\("Gagal menyalin laporan WhatsApp\. Coba lagi\."\)/);
});
