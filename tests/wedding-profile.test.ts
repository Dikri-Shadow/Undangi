import test from "node:test";
import assert from "node:assert/strict";
import { weddingConfig } from "../data/wedding-config";
import { childOrderText, ensureLoveStoryId, instagramUrl, normalizeInstagram } from "../lib/wedding-profile";
import { createWeddingSchema, updateWeddingSchema } from "../lib/cms-validation";

test("nickname fields preserve formal names and remain optional", () => {
  assert.equal(weddingConfig.bride.fullName, "Vina Amelia");
  assert.equal(weddingConfig.bride.shortName, "Bobot");
  assert.equal(weddingConfig.groom.fullName, "Hendriyana");
  assert.equal(weddingConfig.groom.shortName, "Rohman");
  const withoutNickname = structuredClone(weddingConfig); withoutNickname.bride.shortName = "";
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: withoutNickname }).success, true);
});

test("child order labels are configurable and keep legacy fallbacks", () => {
  assert.equal(weddingConfig.bride.childOrderLabel, "Putri terakhir");
  assert.equal(weddingConfig.groom.childOrderLabel, "Putra pertama");
  assert.equal(childOrderText(weddingConfig.bride.childOrderLabel, "bride"), "Putri terakhir dari");
  assert.equal(childOrderText(weddingConfig.groom.childOrderLabel, "groom"), "Putra pertama dari");
  assert.equal(childOrderText(undefined, "bride"), "Putri dari");
  assert.equal(childOrderText("", "groom"), "Putra dari");

  const legacy = structuredClone(weddingConfig);
  delete legacy.bride.childOrderLabel;
  delete legacy.groom.childOrderLabel;
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: legacy }).success, true);
});

test("Instagram values normalize to one canonical username and public URL", () => {
  for (const input of ["vinaamell12", "@vinaamell12", "https://instagram.com/vinaamell12", "https://www.instagram.com/vinaamell12/"]) assert.equal(normalizeInstagram(input), "vinaamell12");
  assert.equal(instagramUrl("@@vinaamell12"), "https://instagram.com/vinaamell12");
  assert.equal(normalizeInstagram(""), ""); assert.equal(instagramUrl(""), "");
});

test("love story schema stays backward-compatible and supports persisted image plus ids", () => {
  const existing = structuredClone(weddingConfig); delete existing.loveStory[0].id;
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: existing }).success, true);
  existing.loveStory[0].id = ensureLoveStoryId(existing.loveStory[0].id, 0);
  existing.loveStory[0].image = "https://cdn.example/story.webp";
  assert.equal(updateWeddingSchema.safeParse({ status: "published", weddingData: existing }).success, true);
  assert.equal(existing.loveStory[0].id, "story-1");
});

test("create schema accepts independent optional nickname fields", () => {
  const parsed = createWeddingSchema.parse({ brideName: "Vina Amelia", groomName: "Hendriyana", brideNickname: "Bobot", groomNickname: "Rohman", slug: "vina-hendri-baru" });
  assert.deepEqual([parsed.brideNickname, parsed.groomNickname], ["Bobot", "Rohman"]);
});
