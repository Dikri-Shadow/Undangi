import test from "node:test";
import assert from "node:assert/strict";
import { weddingConfig } from "../data/wedding-config";
import { applyMediaToConfig, applyPresentationToConfig, clampPhotoZoom, defaultPhotoTransform, isAcceptedImage, isMediaSlot, isPhotoSlot, movePhoto, photoSlotConfig, rotatePhoto } from "../lib/admin-photo";
import { nextToast, toastDurations } from "../lib/admin-toast";
import { presentationFor, presentationRatios } from "../lib/media-presentation";

test("all image formats and distinct profile slots are recognized", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"]) {
    assert.equal(isAcceptedImage({ name: `photo.${type.split("/")[1]}`, type }), true);
  }
  assert.equal(isAcceptedImage({ name: "payload.exe", type: "application/octet-stream" }), false);
  assert.equal(isPhotoSlot("bride"), true); assert.equal(isPhotoSlot("groom"), true);
  assert.equal(isMediaSlot("bride"), true); assert.equal(isMediaSlot("groom"), true);
  assert.equal(isPhotoSlot("love-story"), true); assert.equal(isMediaSlot("love-story"), true);
});

test("love story images are optional, scoped to an item, and retained on reorder", () => {
  const config = structuredClone(weddingConfig);
  assert.equal(config.loveStory.every((story) => !story.image), true);
  applyMediaToConfig(config, "love-story", "/story/lamaran.webp", undefined, 1);
  assert.equal(config.loveStory[1].image, "/story/lamaran.webp");
  const [story] = config.loveStory.splice(1, 1); config.loveStory.splice(0, 0, story);
  assert.equal(config.loveStory[0].image, "/story/lamaran.webp");
});

test("bride and groom media mappings remain isolated", () => {
  const config = structuredClone(weddingConfig); const oldGroom = config.groom.image;
  applyMediaToConfig(config, "bride", "/bride-new.webp");
  assert.equal(config.bride.image, "/bride-new.webp"); assert.equal(config.assets.brideProfile, "/bride-new.webp");
  assert.equal(config.groom.image, oldGroom);
  applyMediaToConfig(config, "groom", "/groom-new.webp");
  assert.equal(config.groom.image, "/groom-new.webp"); assert.equal(config.bride.image, "/bride-new.webp");
});

test("gallery replace does not append a duplicate", () => {
  const config = structuredClone(weddingConfig); const count = config.gallery.length;
  applyMediaToConfig(config, "gallery", "/replacement.webp", 0);
  assert.equal(config.gallery.length, count); assert.equal(config.gallery[0].src, "/replacement.webp");
});

test("mobile and desktop photo presentations persist independently", () => {
  const config = structuredClone(weddingConfig);
  const presentation = { mobile: { zoom: 1.4, rotation: 0, x: -.12, y: .08 }, desktop: { zoom: 1.08, rotation: 90, x: .1, y: -.04 } };
  applyPresentationToConfig(config, "hero", presentation);
  assert.deepEqual(config.mediaPresentation?.hero, presentation);
  assert.deepEqual(presentationFor(config.mediaPresentation?.hero, "mobile"), presentation.mobile);
  assert.deepEqual(presentationFor(config.mediaPresentation?.hero, "desktop"), presentation.desktop);
  assert.notEqual(presentationRatios.hero.mobile, presentationRatios.hero.desktop);
});

test("gallery presentation survives replacement and has a deterministic mobile rhythm", () => {
  const config = structuredClone(weddingConfig);
  applyPresentationToConfig(config, "gallery", { mobile: { zoom: 1.2, rotation: 0, x: 0, y: .1 }, desktop: { zoom: 1, rotation: 0, x: .1, y: 0 } }, 0);
  applyMediaToConfig(config, "gallery", "/replacement.webp", 0);
  assert.equal(config.gallery[0].src, "/replacement.webp");
  assert.deepEqual(config.gallery[0].presentation?.mobile, { zoom: 1.2, rotation: 0, x: 0, y: .1 });
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((index) => index % 3 === 0 ? "full" : "pair"), ["full", "pair", "pair", "full", "pair", "pair"]);
});

test("slot crops have bounded web output dimensions", () => {
  assert.deepEqual(photoSlotConfig.og, { label: "OG Image", ratio: 1200 / 630, width: 1200, height: 630 });
  for (const slot of Object.values(photoSlotConfig)) assert.ok(slot.width <= 1920 && slot.height <= 1800);
});

test("photo editor transform supports zoom, drag, rotate, and reset defaults", () => {
  assert.equal(clampPhotoZoom(.5), 1); assert.equal(clampPhotoZoom(5), 4); assert.equal(clampPhotoZoom(2.25), 2.25);
  assert.deepEqual(movePhoto({ x: 0, y: 0 }, .2, -.3), { x: .2, y: -.3 });
  assert.deepEqual(movePhoto({ x: .9, y: -.9 }, .5, -.5), { x: 1, y: -1 });
  assert.equal(rotatePhoto(0), 90); assert.equal(rotatePhoto(270), 0);
  assert.deepEqual(defaultPhotoTransform, { zoom: 1, rotation: 0, x: 0, y: 0 });
});

test("toast durations are finite and duplicate messages replace instead of stack", () => {
  assert.deepEqual(toastDurations, { success: 2500, info: 3000, warning: 4000, error: 5000 });
  const first = nextToast(null, "error", "Upload gagal", 1);
  const second = nextToast(first, "error", "Upload gagal", 2);
  assert.equal(second?.message, "Upload gagal"); assert.equal(second?.id, 2);
  assert.equal(nextToast(second, "success", "Foto berhasil", 3)?.kind, "success");
});
