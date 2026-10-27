export default function HostShopDashboardLoading() {
  return (
    <main
      className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-brand-blue-600" aria-hidden="true" />
          <div>
            <h1 className="font-black text-slate-950">Opening your Host Shop workspace</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Verifying your secure session and loading this shop&apos;s live records.
            </p>
          </div>
        </div>
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          <div className="h-28 rounded-xl bg-slate-100" />
          <div className="h-28 rounded-xl bg-slate-100" />
          <div className="h-28 rounded-xl bg-slate-100" />
        </div>
      </section>
    </main>
  );
}
