/** Small, accessible progress indicator; keep the underlying dashboard mounted. */
export default function LmsLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-slate-100">
      <div className="h-full w-1/3 animate-pulse bg-blue-600" />
      <span className="sr-only">Loading your saved dashboard records</span>
    </div>
  );
}
