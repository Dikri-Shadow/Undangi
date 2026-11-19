export type WishModerationResult = { decision: "ALLOW" | "BLOCK" | "SPAM"; reason?: string };

// Keep this list intentionally small and explicit. Matching is performed on word-like
// tokens after normalisation, so ordinary words containing a short substring are safe.
const blockedPatterns = [
  /\b(?:anjing|bangsat|brengsek|kontol|memek|ngentot|tolol|goblok|bego)\b/i,
  /\b(?:fuck|f[u4]ck|p[e3]nis|vagina|seks|sex)\b/i,
  /\b(?:bunuh|m[u4]ti|bakar) (?:kamu|loe|lu|anda)\b/i,
];
const spamPatterns = [
  /https?:\/\//i,
  /(?:www\.|t\.me\/|wa\.me\/|bit\.ly\/)/i,
  /\b(?:judi|slot|pinjol|pinjaman online|deposit|jackpot|casino|casino)\b/i,
];

export function normalizeWishText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("id-ID")
    .replace(/[01345789]/g, (char) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g" }[char] ?? char))
    .replace(/[._\-\s]+/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .trim();
}

export function moderateWish(name: string, message: string): WishModerationResult {
  const raw = `${name} ${message}`;
  const text = normalizeWishText(raw);
  const compact = text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (!text || !/[a-zA-ZÀ-ÿ]/.test(text)) return { decision: "SPAM", reason: "empty-or-nontext" };
  if ((raw.match(/[^a-zA-ZÀ-ÿ\s]/g) ?? []).length >= 8) return { decision: "SPAM", reason: "symbol-noise" };
  if (spamPatterns.some((pattern) => pattern.test(text))) return { decision: "SPAM", reason: "promotion-or-link" };
  const compactBlocked = ["anjing", "bangsat", "brengsek", "kontol", "memek", "ngentot", "goblok"];
  if (blockedPatterns.some((pattern) => pattern.test(text) || pattern.test(compact)) || compactBlocked.some((word) => compact.includes(word))) return { decision: "BLOCK", reason: "prohibited-content" };
  if (/^(.)\1+$/.test(text.replace(/\s/g, "")) || /[^a-zA-ZÀ-ÿ\s]{8,}/.test(text)) return { decision: "SPAM", reason: "nonsense" };
  return { decision: "ALLOW" };
}
