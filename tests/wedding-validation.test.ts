import test from "node:test";
import assert from "node:assert/strict";
import { getGuestName } from "../lib/sanitize";
import { rsvpSchema, rsvpSchemaForMaxGuests, wishSchema, isHumanTiming } from "../lib/wedding-validation";
import { moderateWish } from "../lib/wish-moderation";
import { weddingConfig } from "../data/wedding-config";
import { businessConfig } from "../data/business-config";

const base = { weddingSlug: "vina-hendri", submissionId: "11111111-1111-4111-8111-111111111111", startedAt: Date.now() - 2000, website: "" };
test("guest query is decoded, sanitized, limited, and falls back", () => { assert.equal(getGuestName(null), "Tamu Undangan"); assert.equal(getGuestName("Dikriana%20%3Cscript%3E", "Tamu", 18), "Dikriana script"); assert.equal(getGuestName("A".repeat(100), "Tamu", 12).length, 12); });
test("valid RSVP accepts attendance values and sanitizes text", () => { const result = rsvpSchema.parse({ ...base, name: "<b>Dikriana</b>", attendance: "hadir", guests: 2, message: "Halo <script>" }); assert.equal(result.name, "bDikriana/b"); assert.equal(result.attendance, "hadir"); });
test("RSVP rejects invalid attendance, guest count, blank name, and honeypot", () => { for (const value of [{ ...base, name: "", attendance: "hadir", guests: 1 }, { ...base, name: "Dikriana", attendance: "mungkin", guests: 1 }, { ...base, name: "Dikriana", attendance: "tidak", guests: 99 }, { ...base, name: "Dikriana", attendance: "hadir", guests: 1, website: "spam" }]) assert.equal(rsvpSchema.safeParse(value).success, false); });
test("RSVP guest limit is independently configurable per invitation", () => {
  for (const limit of [2, 5, 10]) {
    const schema = rsvpSchemaForMaxGuests(limit);
    const valid = { ...base, name: "QA Tamu", attendance: "hadir", guests: limit, message: "" } as const;
    assert.equal(schema.safeParse(valid).success, true);
    assert.equal(schema.safeParse({ ...valid, guests: limit + 1 }).success, false);
  }
  for (const guests of [0, -1, 1.5, Number.NaN]) assert.equal(rsvpSchemaForMaxGuests(5).safeParse({ ...base, name: "QA Tamu", attendance: "hadir", guests, message: "" }).success, false);
});
test("RSVP legacy default remains four guests", () => {
  assert.equal(rsvpSchema.safeParse({ ...base, name: "QA Tamu", attendance: "hadir", guests: 4, message: "" }).success, true);
  assert.equal(rsvpSchema.safeParse({ ...base, name: "QA Tamu", attendance: "hadir", guests: 5, message: "" }).success, false);
});
test("wishes reject empty, long, HTML is rendered as sanitized text", () => { assert.equal(wishSchema.safeParse({ ...base, name: "Wulan Darianti", message: "" }).success, false); assert.equal(wishSchema.safeParse({ ...base, name: "Wulan Darianti", message: "x".repeat(281) }).success, false); const result = wishSchema.parse({ ...base, name: "Wulan Darianti", message: "<script>alert(1)</script>" }); assert.equal(result.message.includes("<"), false); });
test("minimum submit duration blocks bots and accepts normal timing", () => { assert.equal(isHumanTiming(Date.now(), 1200), false); assert.equal(isHumanTiming(Date.now() - 1500, 1200), true); });
test("wish moderation allows normal prayers and blocks abuse or spam", () => {
  assert.equal(moderateWish("Dikriana", "Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.").decision, "ALLOW");
  assert.equal(moderateWish("Dikriana", "anj1ng sekali").decision, "BLOCK");
  assert.equal(moderateWish("Dikriana", "Promo judi online https://example.test").decision, "SPAM");
  assert.equal(moderateWish("Dikriana", ".........").decision, "SPAM");
  assert.equal(moderateWish("Dikriana", "A N J _ I N G").decision, "BLOCK");
});
test("data status only lists genuinely unfinished production data", () => { assert.equal(weddingConfig.dataStatus.ready, false); assert.deepEqual(weddingConfig.dataStatus.required, ["Love story dan quote final", "Foto asli dan OG image"]); });
test("wedding music uses the configured licensed track", () => { assert.deepEqual(weddingConfig.music, { enabled: true, src: "/audio/bernaung.mp3", title: "Bernaung", artist: "Feby Putri", loop: true }); });
test("business and wedding routes have distinct production canonicals", () => { assert.equal(businessConfig.metadata.canonicalUrl, "https://undangi.my.id"); assert.equal(weddingConfig.metadata.siteUrl, "https://undangi.my.id"); assert.equal(weddingConfig.metadata.canonicalUrl, "https://undangi.my.id/vina-hendri"); assert.equal(weddingConfig.metadata.weddingUrl, weddingConfig.metadata.canonicalUrl); assert.equal(weddingConfig.metadata.shareUrl, weddingConfig.metadata.canonicalUrl); });
test("business WhatsApp link uses the official number and encoded message", () => { const url = new URL(businessConfig.whatsapp.url); assert.equal(url.protocol, "https:"); assert.equal(url.hostname, "wa.me"); assert.equal(url.pathname, "/6285863367362"); assert.equal(url.searchParams.get("text"), "Halo UNDANGI, saya ingin membuat undangan digital. Saya ingin konsultasi mengenai desain dan kebutuhan acara."); });
test("business pricing publishes the approved per-theme launch prices with strikethrough", () => {
  assert.equal(businessConfig.pricing.title, "Tema dan Harga");
  assert.deepEqual(businessConfig.pricing.themes.map((theme) => [theme.slug, theme.amount, theme.originalAmount, theme.discountPercent]), [
    ["sage-klasik", 29000, 49000, 41],
    ["terracotta-senja", 29000, 49000, 41],
    ["blush-sakura", 49000, 79000, 38],
    ["jakarta-modern", 49000, 79000, 38],
    ["emas-tengah-malam", 99000, 149000, 34],
  ]);
  assert.equal(businessConfig.pricing.discountUntil, "2026-12-31");
  assert.ok(businessConfig.pricing.featuresIncluded.length > 0);
});
