export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse" role="status" aria-label="Loading documentation">
      <div className="flex">
        <aside className="hidden lg:block w-64 border-r border-slate-200 min-h-screen p-6">
          <div className="h-6 w-24 bg-slate-200 rounded mb-6" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-5 bg-white rounded mb-3" />
          ))}
        </aside>
        <main className="flex-1 p-8 max-w-4xl">
          <div className="h-10 w-2/3 bg-slate-200 rounded mb-6" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-white rounded" />
            <div className="h-4 w-full bg-white rounded" />
            <div className="h-4 w-3/4 bg-white rounded" />
            <div className="h-4 w-full bg-white rounded" />
            <div className="h-4 w-5/6 bg-white rounded" />
          </div>
        </main>
      </div>
      <span className="sr-only">Loading documentation...</span>
    </div>
  );
}
