export default function ApprenticeLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-h-screen flex items-center justify-center bg-white text-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue-600" />
        <p className="px-4 text-center font-bold">Loading your apprentice dashboard and saved records…</p>
      </div>
    </div>
  );
}
