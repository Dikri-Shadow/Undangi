"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Laptop, Minus, Plus, RotateCcw, RotateCw, Smartphone, X } from "lucide-react";
import { clampPhotoZoom, defaultPhotoTransform, imageReadError, movePhoto, outputFileName, photoSlotConfig, rotatePhoto, type PhotoSlot } from "@/lib/admin-photo";
import { presentationRatios, type PresentationDevice } from "@/lib/media-presentation";
import type { PhotoPresentation, ResponsivePhotoPresentation } from "@/types/wedding";

type Props = {
  file: File;
  slot: PhotoSlot;
  initialPresentation?: ResponsivePhotoPresentation;
  previewQuote?: string;
  onCancel: () => void;
  onSave: (file: File, presentation: ResponsivePhotoPresentation) => Promise<void>;
  onError: (message: string) => void;
};

const freshTransform = (): PhotoPresentation => ({ ...defaultPhotoTransform });

export function PhotoEditor({ file, slot, initialPresentation, previewQuote, onCancel, onSave, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinch = useRef<number | null>(null);
  const dragPoint = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<PresentationDevice>("mobile");
  const [presentation, setPresentation] = useState<Required<ResponsivePhotoPresentation>>({
    mobile: initialPresentation?.mobile ?? freshTransform(),
    desktop: initialPresentation?.desktop ?? freshTransform(),
  });
  const config = photoSlotConfig[slot];
  const transform = presentation[device];
  const ratio = presentationRatios[slot][device];

  const updateTransform = useCallback((change: (value: PhotoPresentation) => PhotoPresentation) => {
    setPresentation((value) => ({ ...value, [device]: change(value[device]) }));
  }, [device]);

  const reset = useCallback(() => updateTransform(freshTransform), [updateTransform]);

  useEffect(() => {
    let disposed = false; let url = "";
    async function load() {
      try {
        let source: Blob = file;
        if (/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
          const { default: heic2any } = await import("heic2any");
          const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: .92 });
          source = Array.isArray(converted) ? converted[0] : converted;
        }
        if (disposed) return;
        url = URL.createObjectURL(source);
        const image = new Image(); image.decoding = "async";
        image.onload = () => { if (!disposed) { imageRef.current = image; setReady(true); } };
        image.onerror = () => onError(imageReadError(file)); image.src = url;
      } catch { onError(/\.(heic|heif)$/i.test(file.name) ? "Gagal memproses foto HEIC/HEIF." : imageReadError(file)); }
    }
    void load();
    return () => { disposed = true; if (url) URL.revokeObjectURL(url); imageRef.current = null; };
  }, [file, onError]);

  useEffect(() => {
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onCancel(); };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", escape); };
  }, [onCancel, saving]);

  const paint = useCallback((target: HTMLCanvasElement, width: number, height: number) => {
    const image = imageRef.current;
    if (!image) return;
    target.width = width; target.height = height;
    const context = target.getContext("2d", { alpha: false });
    if (!context) return;
    const quarterTurn = Math.abs(transform.rotation % 180) === 90;
    const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth;
    const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight;
    const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * transform.zoom;
    context.fillStyle = "#FBE9E4"; context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2 + transform.x * width, height / 2 + transform.y * height);
    context.rotate(transform.rotation * Math.PI / 180);
    context.scale(scale, scale);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    context.restore();
  }, [transform]);

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const width = Math.min(760, Math.max(320, window.innerWidth - 32));
    paint(canvasRef.current, width, Math.round(width / ratio));
  }, [paint, ratio, ready]);

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    try {
      const image = imageRef.current;
      if (!image) throw new Error("Foto belum siap.");
      const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
      const output = document.createElement("canvas");
      output.width = Math.max(1, Math.round(image.naturalWidth * scale));
      output.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = output.getContext("2d", { alpha: false });
      if (!context) throw new Error("Gagal memproses foto.");
      context.drawImage(image, 0, 0, output.width, output.height);
      const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/webp", .9));
      if (!blob) throw new Error("Gagal memproses foto.");
      await onSave(new File([blob], outputFileName(slot), { type: "image/webp", lastModified: Date.now() }), presentation);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Gagal menyimpan hasil crop.");
    } finally { setSaving(false); }
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) dragPoint.current = { x: event.clientX, y: event.clientY };
  }
  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const values = [...pointers.current.values()];
    if (values.length === 2) {
      const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
      if (lastPinch.current) updateTransform((value) => ({ ...value, zoom: clampPhotoZoom(value.zoom * distance / lastPinch.current!) }));
      lastPinch.current = distance; return;
    }
    if (dragPoint.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = (event.clientX - dragPoint.current.x) / rect.width;
      const dy = (event.clientY - dragPoint.current.y) / rect.height;
      updateTransform((value) => ({ ...value, ...movePhoto(value, dx, dy) }));
      dragPoint.current = { x: event.clientX, y: event.clientY };
    }
  }
  function pointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId); dragPoint.current = null; lastPinch.current = null;
  }

  return <div className="fixed inset-0 z-[2000] flex flex-col bg-[#482C34]/95 text-white" role="dialog" aria-modal="true" aria-label={`Edit ${config.label}`}>
    <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4 pt-[env(safe-area-inset-top)]"><div className="min-w-0 flex-1"><p className="font-semibold">{config.label}</p><p className="text-xs text-white/65">Atur komposisi publik secara terpisah untuk HP dan desktop.</p></div><button type="button" onClick={onCancel} aria-label="Tutup editor foto" className="grid size-11 place-items-center rounded-xl hover:bg-white/10"><X /></button></header>
    <div className="flex justify-center gap-2 px-4 pt-4"><button type="button" onClick={() => setDevice("mobile")} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm ${device === "mobile" ? "bg-[#DD9D7F] font-bold text-[#482C34]" : "bg-white/10"}`}><Smartphone size={17} /> HP</button><button type="button" onClick={() => setDevice("desktop")} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm ${device === "desktop" ? "bg-[#DD9D7F] font-bold text-[#482C34]" : "bg-white/10"}`}><Laptop size={17} /> Desktop</button></div>
    <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"><div className="relative max-h-full max-w-full overflow-hidden rounded-xl bg-black shadow-2xl" style={{ aspectRatio: ratio }}><canvas ref={canvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} className="block max-h-[54vh] max-w-full touch-none cursor-grab active:cursor-grabbing" aria-label={`Area crop foto ${device === "mobile" ? "HP" : "desktop"}`} />{slot === "divider" && <><div aria-hidden className="pointer-events-none absolute inset-x-[5%] top-[5%] h-[54%] rounded-lg border border-dashed border-emerald-200/70"><span className="absolute left-2 top-2 rounded bg-black/45 px-2 py-1 text-[10px] font-semibold text-emerald-100">Area aman wajah</span></div><div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 ${device === "mobile" ? "h-[44%]" : "h-[36%]"} bg-[linear-gradient(180deg,transparent,rgba(72,44,52,.82))]`} /><div className={`pointer-events-none absolute inset-x-0 bottom-0 px-[7%] text-center ${device === "mobile" ? "pb-[17%]" : "pb-[9%]"}`}><p className={`mx-auto font-blush-display italic leading-tight drop-shadow-md ${device === "mobile" ? "max-w-[85%] text-[clamp(1rem,5vw,1.8rem)]" : "max-w-[68%] text-[clamp(1.3rem,2.7vw,2.35rem)]"}`}>“{previewQuote}”</p><span className="mt-2 inline-block rounded bg-black/45 px-2 py-1 text-[10px] font-semibold text-white/75">Area aman quote</span></div></>}<div className="pointer-events-none absolute inset-0 border border-white/60 shadow-[inset_0_0_0_9999px_rgba(0,0,0,.08)]" /></div></main>
    <footer className="border-t border-white/10 bg-[#482C34] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"><div className="mx-auto max-w-3xl space-y-3"><div className="flex items-center gap-2"><button type="button" onClick={() => updateTransform((v) => ({ ...v, zoom: clampPhotoZoom(v.zoom - .1) }))} aria-label="Perkecil" className="grid size-11 place-items-center rounded-xl bg-white/10"><Minus /></button><input aria-label="Zoom foto" type="range" min="1" max="4" step="0.01" value={transform.zoom} onChange={(e) => updateTransform((v) => ({ ...v, zoom: clampPhotoZoom(Number(e.target.value)) }))} className="min-w-0 flex-1 accent-[#DD9D7F]" /><button type="button" onClick={() => updateTransform((v) => ({ ...v, zoom: clampPhotoZoom(v.zoom + .1) }))} aria-label="Perbesar" className="grid size-11 place-items-center rounded-xl bg-white/10"><Plus /></button><button type="button" onClick={() => updateTransform((v) => ({ ...v, rotation: rotatePhoto(v.rotation) }))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm"><RotateCw size={17} /> Putar</button></div><div className="flex gap-2"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm"><RotateCcw size={16} /> Reset {device === "mobile" ? "HP" : "Desktop"}</button><button type="button" onClick={onCancel} className="ml-auto min-h-11 rounded-xl px-4 text-sm">Batal</button><button type="button" onClick={() => void save()} disabled={!ready || saving} className="min-h-11 rounded-xl bg-[#DD9D7F] px-5 text-sm font-bold text-[#482C34] disabled:opacity-50">{saving ? "Memproses…" : "Simpan Foto"}</button></div></div></footer>
  </div>;
}
