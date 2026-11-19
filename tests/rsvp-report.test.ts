import test from "node:test";
import assert from "node:assert/strict";
import { buildRsvpCsv, buildWhatsAppReport, calculateRsvpStats } from "@/lib/rsvp-report";

const rows = [
  { id: "a", guestName: "A", rsvp: { guestName: "A", attendance: "hadir" as const, guestCount: 3, message: "OK" } },
  { id: "b", guestName: "B", rsvp: { guestName: "B", attendance: "tidak" as const, guestCount: 1, message: null } },
  { id: "c", guestName: "C", rsvp: null },
];

test("RSVP statistics separate responses, pending, and confirmed guests", () => {
  assert.deepEqual(calculateRsvpStats([], rows), { totalRecipients: 3, responses: 2, pending: 1, attending: 1, declined: 1, guests: 3 });
});

test("empty recipients produce zero statistics", () => {
  assert.deepEqual(calculateRsvpStats([], []), { totalRecipients: 0, responses: 0, pending: 0, attending: 0, declined: 0, guests: 0 });
});

test("RSVP rows without a recipient count in the summary (legacy free-name RSVPs)", () => {
  const legacy = [{ id: "legacy-1", guestName: "Tamu Lama", attendance: "hadir" as const, guestCount: 2, message: null }];
  assert.deepEqual(calculateRsvpStats(legacy, []), { totalRecipients: 0, responses: 1, pending: 0, attending: 1, declined: 0, guests: 2 });
});

test("RSVP rows attached to a recipient are not double-counted", () => {
  const attached = { id: "r-1", guestName: "A", attendance: "hadir" as const, guestCount: 3, message: "OK" };
  const recipients = [{ id: "a", guestName: "A", rsvp: attached }];
  const legacy = { id: "r-2", guestName: "Tamu Lama", attendance: "tidak" as const, guestCount: 1, message: null };
  assert.deepEqual(calculateRsvpStats([attached, legacy], recipients), { totalRecipients: 1, responses: 2, pending: 0, attending: 1, declined: 1, guests: 3 });
});

test("CSV has UTF-8 BOM, headers, quoting, and formula protection", () => {
  const csv = buildRsvpCsv([{ guestName: "Doe, \"A\"", attendance: "hadir", guestCount: 2, message: "line 1\nline 2", createdAt: "2026-11-13" }, { guestName: "=SUM(A1)", attendance: "tidak", guestCount: 1, message: "", createdAt: "" }]);
  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /Nama tamu/);
  assert.match(csv, /"Doe, ""A"""/);
  assert.match(csv, /'\=SUM\(A1\)/);
  assert.match(csv, /line 1\nline 2/);
});

test("WhatsApp report preserves summary and special wedding names", () => {
  const report = buildWhatsAppReport("Vina & Hendri", calculateRsvpStats([], rows));
  assert.match(report, /Laporan RSVP Vina & Hendri/);
  assert.match(report, /Total tamu: 3/);
  assert.match(report, /Belum merespons: 1/);
  assert.match(report, /Jumlah tamu hadir: 3/);
});
