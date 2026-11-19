import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eventPages, getEventPage } from "../data/event-pages";
import { businessConfig } from "../data/business-config";

const repoRoot = process.cwd();
function read(...parts: string[]) {
  return readFileSync(join(repoRoot, ...parts), "utf8");
}

test("event pages exist for pernikahan, khitanan, and aqiqah, each with intro and data checklist", () => {
  assert.deepEqual(eventPages.map((page) => page.slug), ["pernikahan", "khitanan", "aqiqah"]);
  for (const page of eventPages) {
    assert.ok(page.title.length > 0 && page.intro.length > 0 && page.metaDescription.length > 0);
    assert.ok(page.checklist.length >= 5, `${page.slug} checklist too short`);
    for (const item of page.checklist) {
      assert.ok(item.label.length > 0 && item.detail.length > 0);
    }
    assert.equal(getEventPage(page.slug)?.slug, page.slug);
  }
  assert.equal(getEventPage("natal"), undefined);
});

test("event page content makes no fabricated claims", () => {
  const text = JSON.stringify(eventPages).toLowerCase();
  for (const banned of ["rating", "testimoni", "juta undangan", "5,0", "terbaik di indonesia", "jaminan"]) {
    assert.equal(text.includes(banned), false, `banned claim in event pages: ${banned}`);
  }
});

test("event pages use one shared template route and are linked from the landing", () => {
  const route = read("app", "acara", "[jenis]", "page.tsx");
  assert.ok(route.includes("generateStaticParams"));
  assert.ok(route.includes("EventPage"));
  assert.ok(route.includes("getEventPage"));
  const template = read("components", "marketing", "event-page.tsx");
  assert.ok(template.includes("checklist"));
  assert.ok(template.includes("/demo?tema="));
  assert.ok(template.includes("/#pesan"));
  assert.ok(template.includes("businessConfig.whatsapp.url"));
  const landing = read("components", "marketing", "landing-page.tsx");
  for (const slug of ["pernikahan", "khitanan", "aqiqah"]) {
    assert.ok(landing.includes(`/acara/${slug}`), `landing missing link to /acara/${slug}`);
  }
  // Strip tema memakai harga per tema yang sama dengan katalog (tidak ada harga baru).
  assert.equal(businessConfig.pricing.themes.length, 5);
});
