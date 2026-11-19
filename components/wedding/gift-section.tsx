"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { WeddingConfig } from "@/types/wedding";
import { SectionHeading } from "./section-heading";

export function GiftSection({ gift }: { gift: WeddingConfig["gift"] }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(number: string) { try { await navigator.clipboard.writeText(number); setCopied(number); setTimeout(() => setCopied(null), 2200); } catch { setCopied(null); } }
  return <section className="bg-[var(--w-soft-white)] px-6 py-24 sm:py-28 lg:px-12"><div className="mx-auto max-w-5xl"><SectionHeading eyebrow="A Token of Love" title="Wedding Gift" /><p className="mx-auto -mt-3 max-w-xl text-center leading-7 text-[var(--w-muted)]">{gift.intro}</p>{gift.enabled && gift.accounts.length ? <div className={`mt-9 grid gap-5 ${gift.accounts.length === 1 ? "lg:mx-auto lg:max-w-xl" : "sm:grid-cols-2"}`}>{gift.accounts.map((account) => <article key={`${account.provider}-${account.number}`} className="rounded-[1.7rem] border border-[var(--w-gold)]/35 bg-[var(--w-cream)] p-6 lg:p-8"><p className="text-xs font-bold tracking-[.2em] text-[var(--w-accent)]">{account.provider}</p><p className="font-serif-display mt-4 text-3xl tracking-wide text-[var(--w-dark)]">{account.number}</p><p className="mt-2 text-sm text-[var(--w-muted)]">a.n. {account.holder}</p><button onClick={() => copy(account.number)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--w-primary)]/20 px-4 text-sm text-[var(--w-primary)]">{copied === account.number ? <><Check size={15} /> Berhasil disalin</> : <><Copy size={15} /> Salin nomor {account.type === "ewallet" ? "e-wallet" : "rekening"}</>}</button></article>)}</div> : <p className="mt-7 text-center text-sm text-[var(--w-muted)]">{gift.emptyMessage}</p>}</div></section>;
}
