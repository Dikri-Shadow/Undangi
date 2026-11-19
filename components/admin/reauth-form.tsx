"use client";
import { useState } from "react";

export function ReauthForm() {
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  async function verify(event: React.FormEvent) {
    event.preventDefault(); setFeedback(""); setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/reauth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      setFeedback(response.ok ? "Konfirmasi aktif selama 10 menit." : "Password tidak valid.");
      setPassword("");
    } catch { setFeedback("Konfirmasi belum dapat diproses."); }
    finally { setLoading(false); }
  }
  return <form onSubmit={verify} className="mt-6 max-w-sm space-y-3"><h2 className="font-semibold">Konfirmasi tindakan sensitif</h2><p className="text-sm text-[#6A565A]">Masukkan kembali password admin. Konfirmasi berlaku selama 10 menit.</p><input aria-label="Password admin" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="min-h-12 w-full rounded-xl border px-4" placeholder="Password admin" /><button disabled={!password || loading} className="min-h-11 rounded-xl border px-4 disabled:opacity-50">{loading ? "Memverifikasi…" : "Konfirmasi 10 menit"}</button>{feedback && <p role="status" className="text-sm text-[#6A565A]">{feedback}</p>}</form>;
}
