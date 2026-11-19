export function sanitizePlainText(value: string, maxLength = 80) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function getGuestName(value: string | null, fallback = "Tamu Undangan", maxLength = 60) {
  if (!value) return fallback;
  try { return sanitizePlainText(decodeURIComponent(value), maxLength) || fallback; }
  catch { return sanitizePlainText(value, maxLength) || fallback; }
}
