import { createBootstrapToken, hashBootstrapToken } from "../lib/admin-bootstrap";

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server environment wajib tersedia.");
const minutes = 30;
const token = createBootstrapToken();
const response = await fetch(`${url}/rest/v1/admin_bootstrap_tokens`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ token_hash: hashBootstrapToken(token), expires_at: new Date(Date.now() + minutes * 60_000).toISOString() }) });
if (!response.ok) throw new Error(`Bootstrap token gagal dibuat (${response.status}). Pastikan migration terbaru sudah diterapkan.`);
const siteUrl = (process.env.UNDANGI_BOOTSTRAP_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5175").replace(/\/$/, "");
const setupUrl = `${siteUrl}/login?setup=${encodeURIComponent(token)}`;
if (process.env.UNDANGI_BOOTSTRAP_OPEN_BROWSER === "1") {
  const { spawn } = await import("node:child_process");
  if (process.platform === "win32") spawn("cmd.exe", ["/d", "/c", "start", "", setupUrl], { detached: true, stdio: "ignore" }).unref();
  console.log("One-time setup URL dibuka di browser lokal.");
} else {
  console.log(`One-time setup URL (${minutes} menit):`);
  console.log(setupUrl);
}
