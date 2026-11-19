"use client";
import { useState } from "react";
import { TurnstileField } from "./turnstile-field";

export function LoginForm({ setupToken, turnstileSiteKey }: { setupToken?: string; turnstileSiteKey: string }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(turnstileSiteKey ? "" : "local-development");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return; setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try { const response = await fetch(setupToken ? "/api/admin/auth/bootstrap" : "/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setupToken ? { email: form.get("email"), password: form.get("password"), confirmPassword: form.get("confirmPassword"), setupToken, turnstileToken } : { email: form.get("email"), password: form.get("password"), turnstileToken }) }); const data = await response.json() as { error?: string; next?: string }; if (!response.ok) throw new Error(data.error || "Login gagal."); window.location.assign(data.next || "/admin"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Login gagal."); setLoading(false); }
  }
  return <form onSubmit={submit} className="mt-8 space-y-5">
    <label className="block text-sm font-semibold text-[#482C34]">Email<input required autoComplete="username" name="email" type="email" className="mt-2 min-h-12 w-full rounded-xl border border-[#BF6D87]/20 bg-white px-4 outline-none focus:border-[#BF6D87] focus:ring-2 focus:ring-[#BF6D87]/10" /></label>
    <label className="block text-sm font-semibold text-[#482C34]">Password<input required autoComplete={setupToken ? "new-password" : "current-password"} name="password" type="password" minLength={setupToken ? 12 : 8} className="mt-2 min-h-12 w-full rounded-xl border border-[#BF6D87]/20 bg-white px-4 outline-none focus:border-[#BF6D87] focus:ring-2 focus:ring-[#BF6D87]/10" /></label>
    {setupToken && <label className="block text-sm font-semibold text-[#482C34]">Konfirmasi Password<input required autoComplete="new-password" name="confirmPassword" type="password" minLength={12} className="mt-2 min-h-12 w-full rounded-xl border border-[#BF6D87]/20 bg-white px-4 outline-none focus:border-[#BF6D87] focus:ring-2 focus:ring-[#BF6D87]/10" /></label>}
    {turnstileSiteKey ? <TurnstileField siteKey={turnstileSiteKey} onToken={setTurnstileToken} /> : <p className="text-xs text-[#6A565A]">Verifikasi Cloudflare tidak aktif.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={loading || !turnstileToken} className="min-h-12 w-full rounded-xl bg-[#BF6D87] px-5 font-semibold text-white disabled:opacity-60">{loading ? "Memeriksa…" : setupToken ? "Buat Admin" : "Masuk"}</button>
  </form>;
}
