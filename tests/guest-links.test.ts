import assert from "node:assert/strict";
import test from "node:test";
import { buildGuestLink, formatGuestLinks, parseGuestNames } from "../lib/guest-links";

test("guest links preserve names and encode reserved characters", () => {
  assert.deepEqual(buildGuestLink("https://undangi.my.id", "vina-hendri", "  Dikriana & Keluarga  "), { name: "Dikriana & Keluarga", url: "https://undangi.my.id/vina-hendri?to=Dikriana%20%26%20Keluarga" });
});

test("personal guest links are just ?to=Nama, with no token in the URL", () => {
  assert.deepEqual(buildGuestLink("https://undangi.my.id", "vina-hendri", "Dikri", "tok3n-abc"), { name: "Dikri", url: "https://undangi.my.id/vina-hendri?to=Dikri" });
  assert.deepEqual(buildGuestLink("https://undangi.my.id", "vina-hendri", "Dikri"), { name: "Dikri", url: "https://undangi.my.id/vina-hendri?to=Dikri" });
});

test("bulk parsing removes blank lines without changing or deduplicating names", () => {
  assert.deepEqual(parseGuestNames("Wulan Darianti\n\n Dikriana & Keluarga \nWulan Darianti"), ["Wulan Darianti", "Dikriana & Keluarga", "Wulan Darianti"]);
});

test("copy all format keeps full names and URLs", () => {
  const links = [buildGuestLink("https://undangi.my.id/", "vina-hendri", "Dikriana & Keluarga"), buildGuestLink("https://undangi.my.id", "vina-hendri", "Wulan Darianti")];
  assert.equal(formatGuestLinks(links), "Dikriana & Keluarga\nhttps://undangi.my.id/vina-hendri?to=Dikriana%20%26%20Keluarga\n\nWulan Darianti\nhttps://undangi.my.id/vina-hendri?to=Wulan%20Darianti");
});
