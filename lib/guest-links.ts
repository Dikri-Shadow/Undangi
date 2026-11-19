export type GuestLink = { name: string; url: string };

export function normalizeGuestName(value: string) {
  return value.trim();
}

export function buildGuestLink(baseUrl: string, slug: string, name: string, token?: string): GuestLink {
  const normalized = normalizeGuestName(name);
  const base = `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(slug)}`;
  // Link tamu cukup ?to=Nama — tanpa token tambahan. Nama dari ?to=
  // dipakai untuk mengisi RSVP dan dicocokkan ke daftar tamu customer.
  // Parameter token dipertahankan agar pemanggil lama tidak rusak,
  // tapi sengaja tidak dimasukkan ke URL.
  void token;
  return { name: normalized, url: `${base}?to=${encodeURIComponent(normalized)}` };
}

export function parseGuestNames(value: string) {
  return value.split(/\r?\n/).map(normalizeGuestName).filter(Boolean);
}

export function formatGuestLinks(links: GuestLink[]) {
  return links.map((link) => `${link.name}\n${link.url}`).join("\n\n");
}
