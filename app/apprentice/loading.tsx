export default function ApprenticeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue-600" />
        <p className="text-sm text-slate-500">Loading apprentice dashboard...</p>
      </div>
    </div>
  );
}
