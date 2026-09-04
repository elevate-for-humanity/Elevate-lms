export default function LmsLoading() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-slate-200/70"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading Elevate LMS"
    >
      <div className="h-full w-1/3 animate-pulse rounded-r-full bg-brand-red-600" />
      <span className="sr-only">Loading your secure workspace.</span>
    </div>
  );
}
