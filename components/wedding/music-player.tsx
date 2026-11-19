"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Music2, Pause, Play } from "lucide-react";

export type MusicPlayerHandle = { play: () => void };

type MusicPlayerProps = { src?: string; active: boolean; loop?: boolean; title?: string; artist?: string };

export const MusicPlayer = forwardRef<MusicPlayerHandle, MusicPlayerProps>(function MusicPlayer(
  { src, active, loop = true, title = "Musik pernikahan", artist },
  ref,
) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [controlHost, setControlHost] = useState<HTMLElement | null>(null);
  const label = artist ? `${title} — ${artist}` : title;

  useEffect(() => {
    if (active) setControlHost(document.getElementById("wedding-audio-slot"));
    else setControlHost(null);
  }, [active]);

  function tryPlay() {
    const element = audio.current;
    if (!element || !src) return;
    if (!element.src) element.src = src;
    const attempt = element.play();
    if (attempt) attempt.catch(() => setPlaying(false));
  }

  useImperativeHandle(ref, () => ({ play: tryPlay }));

  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (element.paused) tryPlay();
    else element.pause();
  }

  if (!src) return null;

  return <>
    <audio ref={audio} loop={loop} preload="none" aria-label={label} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setPlaying(false)} />
    {active && controlHost && createPortal(<button onClick={toggle} aria-label={playing ? `Jeda ${label}` : `Putar ${label}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--w-gold-light)] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--w-gold-light)]">{playing ? <><span className="animate-[spin_7s_linear_infinite]"><Music2 size={18} /></span><Pause className="sr-only" /></> : <Play size={17} />}</button>, controlHost)}
  </>;
});
