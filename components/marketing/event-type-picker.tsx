"use client";
import {
  Baby, BriefcaseBusiness, CakeSlice, HandHeart, Heart, Sparkles,
} from "lucide-react";

// Jenis acara yang sama dengan yang disebut di FAQ landing — hanya acara
// yang memang ditawarkan UNDANGI. Memilih salah satu langsung mengisi
// kolom "Jenis acara" di formulir pemesanan (#pesan).
export const eventTypes = [
  [Heart, "Pernikahan"], [CakeSlice, "Ulang Tahun"], [HandHeart, "Lamaran"],
  [Baby, "Khitanan"], [Sparkles, "Aqiqah"], [BriefcaseBusiness, "Acara Bisnis"],
] as const;

export const setEventTypeEvent = "undangi:set-event-type";

export function EventTypePicker() {
  function choose(label: string) {
    window.dispatchEvent(new CustomEvent<string>(setEventTypeEvent, { detail: label }));
    document.getElementById("pesan")?.scrollIntoView({ behavior: "smooth" });
  }
  return <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
    {eventTypes.map(([Icon, label]) => <button key={label} type="button" onClick={() => choose(label)} aria-label={`Pilih jenis acara ${label}`} className="border-t border-[#DD9D7F]/45 pt-4 text-center transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BF6D87]">
      <Icon aria-hidden className="mx-auto size-5 text-[#BF6D87]" strokeWidth={1.6} />
      <p className="mt-2 text-sm font-semibold text-[#482C34]">{label}</p>
    </button>)}
  </div>;
}
