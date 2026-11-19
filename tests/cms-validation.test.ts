import test from "node:test";
import assert from "node:assert/strict";
import { createWeddingSchema, slugSchema, updateWeddingSchema } from "../lib/cms-validation";
import { createNewWeddingConfig, weddingConfig } from "../data/wedding-config";

test("CMS slug accepts safe lowercase values and rejects unsafe paths", () => {
  assert.equal(slugSchema.safeParse("vina-hendri").success, true);
  for (const slug of ["Vina-Hendri", "vina hendri", "../admin", "x", "vina_hendri"]) assert.equal(slugSchema.safeParse(slug).success, false);
});

test("new invitation requires only couple names and a safe slug", () => {
  assert.equal(createWeddingSchema.safeParse({ brideName: "Vina", groomName: "Hendri", slug: "vina-hendri" }).success, true);
  assert.equal(createWeddingSchema.safeParse({ brideName: "", groomName: "Hendri", slug: "vina-hendri" }).success, false);
});

test("CMS save validates status and core wedding identity", () => {
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: weddingConfig }).success, true);
  assert.equal(updateWeddingSchema.safeParse({ status: "deleted", weddingData: weddingConfig }).success, false);
  assert.equal(updateWeddingSchema.safeParse({ status: "draft", weddingData: { ...weddingConfig, slug: "BAD SLUG" } }).success, false);
});

test("new invitation config is isolated from the Vina and Hendri demo data", () => {
  const config = createNewWeddingConfig({ slug: "contoh-acara", brideName: "Dikriana", groomName: "Wulan Darianti" });
  assert.equal(config.slug, "contoh-acara");
  assert.equal(config.bride.fatherName, ""); assert.equal(config.groom.motherName, "");
  assert.equal(config.bride.instagram, ""); assert.equal(config.groom.instagram, "");
  assert.equal(config.events[0].venue, ""); assert.equal(config.events[1].address, "");
  assert.equal(config.loveStory.length, 0); assert.equal(config.gallery.length, 0);
  assert.equal(config.assets.hero, ""); assert.equal(config.assets.brideProfile, "");
  assert.equal(config.gift.accounts.length, 0); assert.equal(config.music.src, "");
  assert.notEqual(config.couple.display, weddingConfig.couple.display);
});
