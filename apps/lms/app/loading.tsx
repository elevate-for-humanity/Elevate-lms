export default function LmsLoading() {
  return (
    <main
      className="min-h-dvh w-full overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading Elevate LMS"
    >
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-200" />
          </div>
        </div>
        <div className="h-8 w-56 max-w-full rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-200" />
        </div>
        <span className="sr-only">Loading your secure workspace.</span>
      </div>
    </main>
  );
}
