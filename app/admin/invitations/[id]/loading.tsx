export default function InvitationWorkspaceLoading() {
  return <main className="mx-auto w-full max-w-6xl animate-pulse p-4 sm:p-6 lg:p-8" aria-label="Memuat bagian undangan" aria-busy="true">
    <div className="h-7 w-40 rounded-lg bg-black/[.07]" />
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
      <div className="min-h-72 rounded-2xl border border-black/[.05] bg-white p-5"><div className="h-5 w-2/3 rounded bg-black/[.06]" /><div className="mt-5 h-3 w-full rounded bg-black/[.05]" /><div className="mt-6 grid gap-3 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-14 rounded-xl bg-black/[.045]" />)}</div></div>
      <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 rounded-2xl border border-black/[.05] bg-white" />)}</div>
    </div>
  </main>;
}
