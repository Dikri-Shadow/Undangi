"use client";
import { useEffect, useRef, useState } from "react";
import type { WeddingConfig } from "@/types/wedding";
import { InvitationGate } from "./invitation-gate";
import { CinematicHero } from "./cinematic-hero";
import { QuoteSection } from "./quote-section";
import { CoupleProfiles } from "./couple-profiles";
import { SaveTheDate } from "./save-the-date";
import { EventDetails } from "./event-details";
import { CinematicDivider } from "./cinematic-divider";
import { LoveStory } from "./love-story";
import { Gallery } from "./gallery";
import { RsvpSection } from "./rsvp-section";
import { WishesSection } from "./wishes-section";
import { GiftSection } from "./gift-section";
import { MusicPlayer, type MusicPlayerHandle } from "./music-player";
import { FloatingNav } from "./floating-nav";
import { ClosingSection } from "./closing-section";
import { PersonalRecipientProvider } from "@/hooks/use-personal-recipient";

export function WeddingInvitation({ config, guest = "Tamu Undangan", preview = false, demo = false }: { config: WeddingConfig; guest?: string; preview?: boolean; demo?: boolean }) {
  const [opened, setOpened] = useState(preview); const [opening, setOpening] = useState(false);
  const musicPlayer = useRef<MusicPlayerHandle>(null);
  function openInvitation() { musicPlayer.current?.play(); setOpening(true); document.body.classList.remove("gate-locked"); document.documentElement.classList.remove("gate-locked"); window.setTimeout(() => { setOpened(true); setOpening(false); }, 1400); }
  useEffect(() => {
    if (!opened && !preview) { document.body.classList.add("gate-locked"); document.documentElement.classList.add("gate-locked"); }
    return () => { document.body.classList.remove("gate-locked"); document.documentElement.classList.remove("gate-locked"); };
  }, [opened, preview]);
  return <PersonalRecipientProvider slug={config.slug}><main id="home" className="overflow-x-clip bg-[var(--w-soft-white)] lg:mx-auto lg:max-w-[1280px] lg:shadow-[0_0_80px_rgba(20,4,8,.24)]">
    {!opened && !preview && <InvitationGate config={config} guest={guest} opening={opening} onOpen={openInvitation} demo={demo} />}
    <CinematicHero config={config} active={opened || opening} />
    <QuoteSection quote={config.quotes.opening} /><CoupleProfiles groom={config.groom} bride={config.bride} mediaPresentation={config.mediaPresentation} />
    <SaveTheDate target={config.weddingDate} label={config.dateLabel} /><EventDetails events={config.events} coupleDisplay={config.couple.display} slug={config.slug} />
    <CinematicDivider image={config.assets.divider} presentation={config.mediaPresentation?.divider} quote={config.quotes.divider} />
    <LoveStory items={config.loveStory} coupleName={config.couple.display} /><Gallery images={config.gallery} excludeOnDesktop={[config.assets.hero, config.bride.image, config.groom.image]} />{demo ? <><section id="rsvp" className="bg-[var(--w-soft-white)] px-6 py-24 sm:py-32"><div className="mx-auto max-w-xl text-center"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[var(--w-accent)]">Contoh Demo</p><h2 className="font-serif-display mt-3 text-3xl text-[var(--w-dark)]">Konfirmasi Kehadiran</h2><p className="mt-3 text-sm leading-7 text-[var(--w-muted)]">RSVP dinonaktifkan di halaman contoh ini — undangan ini hanya demo, jadi tidak ada konfirmasi yang dikirim.</p></div></section><section className="bg-[var(--w-cream)] px-6 py-24 sm:py-32"><div className="mx-auto max-w-xl text-center"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[var(--w-accent)]">Contoh Demo</p><h2 className="font-serif-display mt-3 text-3xl text-[var(--w-dark)]">Ucapan &amp; Doa</h2><p className="mt-3 text-sm leading-7 text-[var(--w-muted)]">Ucapan dinonaktifkan di halaman contoh ini — undangan ini hanya demo, jadi tidak ada ucapan yang dikirim.</p></div></section></> : <><RsvpSection slug={config.slug} config={config.rsvp} /><WishesSection slug={config.slug} config={config.wishes} /></>}
    <GiftSection gift={config.gift} /><ClosingSection config={config} />
    {!preview && <MusicPlayer ref={musicPlayer} src={config.music.enabled ? config.music.src : undefined} active={opened} loop={config.music.loop} title={config.music.title} artist={config.music.artist} />}<FloatingNav visible={opened && !preview} />
  </main></PersonalRecipientProvider>;
}
