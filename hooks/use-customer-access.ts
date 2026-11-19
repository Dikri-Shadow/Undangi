"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomerRecipient, CustomerRecipientCredential, CustomerRecipientInput, CustomerStats } from "@/types/customer";

type State = { status: "loading" | "ready" | "error"; error: string; recipients: CustomerRecipient[]; stats: CustomerStats | null };
const initial: State = { status: "loading", error: "", recipients: [], stats: null };

export function useCustomerAccess(slug: string) {
  const [state, setState] = useState<State>(initial);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...init, headers, cache: "no-store" });
    const data = await response.json().catch(() => ({})) as { error?: string; recipients?: CustomerRecipient[]; stats?: CustomerStats };
    if (!response.ok) throw new Error(data.error || "Permintaan belum dapat diproses.");
    return data;
  }, []);

  const refresh = useCallback(async () => {
    const data = await request(`/api/customer/${encodeURIComponent(slug)}/recipients`);
    setState((current) => ({ ...current, status: "ready", recipients: data.recipients ?? [], stats: data.stats ?? current.stats, error: "" }));
  }, [request, slug]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access = fragment.get("access");
        if (access) {
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
          const response = await fetch(`/api/customer/${encodeURIComponent(slug)}/session/exchange`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ token: access }), cache: "no-store" });
          if (!response.ok) throw new Error("Link akses tidak valid atau sudah tidak aktif.");
          const recipientsResponse = await fetch(`/api/customer/${encodeURIComponent(slug)}/recipients`, { headers: { Accept: "application/json" }, credentials: "include", cache: "no-store" });
          const recipientsData = await recipientsResponse.json().catch(() => ({})) as { error?: string; recipients?: CustomerRecipient[]; stats?: CustomerStats };
          if (!recipientsResponse.ok) throw new Error(recipientsData.error || "Daftar tamu belum dapat dimuat.");
          if (!cancelled) setState({ status: "ready", error: "", recipients: recipientsData.recipients ?? [], stats: recipientsData.stats ?? null });
          return;
        }
        if (!cancelled) await refresh();
      } catch (error) {
        if (!cancelled) setState({ ...initial, status: "error", error: error instanceof Error ? error.message : "Akses belum dapat dibuka." });
      }
    }
    void bootstrap();
    return () => { cancelled = true; };
  }, [refresh, slug]);

  const mutate = useCallback(async (method: "POST" | "PATCH" | "DELETE", id: string | undefined, input?: CustomerRecipientInput) => {
    const data = await request(`/api/customer/${encodeURIComponent(slug)}/recipients`, { method, body: JSON.stringify(id ? { ...input, id } : input) });
    await refresh();
    return data as { recipient?: CustomerRecipientCredential };
  }, [refresh, request, slug]);

  const logout = useCallback(async () => {
    await fetch(`/api/customer/${encodeURIComponent(slug)}/session`, { method: "DELETE", credentials: "include", cache: "no-store" }).catch(() => undefined);
    setState({ ...initial, status: "error", error: "Anda telah keluar dari akses customer." });
  }, [slug]);

  return { ...state, refresh, add: (input: CustomerRecipientInput) => mutate("POST", undefined, input), edit: (id: string, input: CustomerRecipientInput) => mutate("PATCH", id, input), remove: (id: string) => mutate("DELETE", id), logout };
}
