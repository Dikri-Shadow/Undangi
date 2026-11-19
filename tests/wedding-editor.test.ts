import test from "node:test";
import assert from "node:assert/strict";
import { weddingConfig } from "../data/wedding-config";
import { isSafeGoogleMapsEmbedUrl, isSafeGoogleMapsUrl } from "../lib/maps";
import { wizardSteps } from "../lib/wedding-editor";
import { updateWeddingSchema } from "../lib/cms-validation";

test("wizard follows the client intake order", () => {
  assert.deepEqual([...wizardSteps], ["Mempelai Wanita", "Mempelai Pria", "Akad Nikah", "Resepsi", "Love Story", "Wedding Gift", "Foto", "Musik", "Informasi Tambahan", "SEO & Link", "Review & Publish"]);
});

test("Vina and Hendri final data keeps slug and distinct formal/nickname fields", () => {
  assert.equal(weddingConfig.slug, "vina-hendri");
  assert.deepEqual([weddingConfig.bride.fullName, weddingConfig.bride.shortName], ["Vina Amelia", "Bobot"]);
  assert.deepEqual([weddingConfig.groom.fullName, weddingConfig.groom.shortName], ["Hendriyana", "Rohman"]);
  assert.equal(weddingConfig.events[0].endTime, "10:00");
  assert.equal(weddingConfig.events[1].endTime, "Selesai");
  assert.equal(weddingConfig.loveStory.length, 3);
  assert.equal(weddingConfig.gift.accounts[0]?.provider, "DANA");
});

test("Google Maps links and embeds are allowlisted independently", () => {
  assert.equal(isSafeGoogleMapsUrl(weddingConfig.events[0].mapsUrl), true);
  assert.equal(isSafeGoogleMapsEmbedUrl(""), false);
  assert.equal(isSafeGoogleMapsEmbedUrl("https://www.google.com/maps/embed?pb=safe"), true);
  assert.equal(isSafeGoogleMapsEmbedUrl("https://www.google.com/maps/@0,0,1z"), false);
  assert.equal(isSafeGoogleMapsEmbedUrl("https://evil.example/maps/embed"), false);
  assert.equal(weddingConfig.events[0].panoramaId, "K6pwAeXl6Y0IHguaeCuLlQ");
});

test("CMS rejects an unsafe map embed and accepts an empty embed", () => {
  const safe = structuredClone(weddingConfig);
  safe.events[0].mapsEmbedUrl = "";
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: safe }).success, true);
  safe.events[0].mapsEmbedUrl = "https://evil.example/maps/embed";
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: safe }).success, false);
});
