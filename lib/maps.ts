export function isSafeGoogleMapsUrl(value: string | undefined) {
  if (!value) return false;
  try { const url = new URL(value); return url.protocol === "https:" && (url.hostname === "www.google.com" || url.hostname === "google.com" || url.hostname.endsWith(".google.com") || url.hostname === "maps.google.com" || url.hostname === "maps.app.goo.gl"); } catch { return false; }
}

export function isSafeGoogleMapsEmbedUrl(value: string | undefined) {
  if (!value) return false;
  try { const url = new URL(value); return url.protocol === "https:" && (url.hostname === "www.google.com" || url.hostname === "maps.google.com") && url.pathname.startsWith("/maps/embed"); } catch { return false; }
}
