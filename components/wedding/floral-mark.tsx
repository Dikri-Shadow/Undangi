export function FloralMark({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-flex items-center gap-2 text-[var(--w-gold)] ${className}`}><span className="h-px w-8 bg-current/50" /><span className="text-base">✦</span><span className="h-px w-8 bg-current/50" /></span>;
}
