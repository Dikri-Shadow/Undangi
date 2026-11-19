export default function TrashLoading() {
  return <main className="mx-auto w-full max-w-[1540px] animate-pulse p-5 sm:p-7 xl:p-9" aria-label="Memuat Sampah" aria-busy="true"><div className="h-8 w-36 rounded-lg bg-black/[.07]" /><div className="mt-8 grid gap-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-28 rounded-2xl border border-black/[.05] bg-white" />)}</div></main>;
}
