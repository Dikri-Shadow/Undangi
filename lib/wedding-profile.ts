export function normalizeInstagram(value?: string) {
  const input = value?.trim();
  if (!input) return "";
  const withoutProtocol = input.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "");
  return withoutProtocol.replace(/^@+/, "").split(/[/?#]/)[0].trim();
}

export function instagramUrl(value?: string) {
  const username = normalizeInstagram(value);
  return username ? `https://instagram.com/${username}` : "";
}

export function ensureLoveStoryId(id: string | undefined, index: number) {
  return id?.trim() || `story-${index + 1}`;
}

export function childOrderText(value: string | undefined, person: "bride" | "groom") {
  const label = value?.trim() || (person === "bride" ? "Putri" : "Putra");
  return `${label} dari`;
}
