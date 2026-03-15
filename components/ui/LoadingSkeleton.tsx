export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse" role="status" aria-label="Loading page content">
      <div className="bg-white border-b border-slate-200 h-16" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-64 bg-slate-200 rounded mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-40 bg-slate-200 rounded-lg mb-4" />
              <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse" role="status" aria-label="Loading dashboard">
      <div className="flex">
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-4 space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-slate-100 rounded" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-8 w-16 bg-slate-300 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}

export function TableLoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm animate-pulse" role="status" aria-label="Loading table">
      <div className="p-4 border-b border-slate-200">
        <div className="h-6 w-40 bg-slate-200 rounded" />
      </div>
      <div className="p-4">
        <div className="h-10 bg-slate-100 rounded mb-4" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-14 bg-slate-50 rounded mb-2 border border-slate-100" />
        ))}
      </div>
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

export function FormLoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 animate-pulse" role="status" aria-label="Loading form">
      <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        ))}
        <div className="h-12 w-32 bg-slate-300 rounded-lg" />
      </div>
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

export function CourseLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse" role="status" aria-label="Loading course">
      <div className="flex">
        <aside className="hidden lg:block w-80 bg-white min-h-screen p-4">
          <div className="h-6 w-32 bg-white rounded mb-6" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-4">
              <div className="h-5 w-full bg-white rounded mb-2" />
              <div className="pl-4 space-y-2">
                <div className="h-4 w-3/4 bg-white/50 rounded" />
                <div className="h-4 w-2/3 bg-white/50 rounded" />
              </div>
            </div>
          ))}
        </aside>
        <main className="flex-1">
          <div className="aspect-video bg-white" />
          <div className="p-6">
            <div className="h-8 w-2/3 bg-white rounded mb-4" />
            <div className="h-4 w-full bg-white/50 rounded mb-2" />
            <div className="h-4 w-3/4 bg-white/50 rounded" />
          </div>
        </main>
      </div>
      <span className="sr-only">Loading course content...</span>
    </div>
  );
}

export function CardGridLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="h-48 bg-slate-200" />
          <div className="p-4">
            <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-full bg-slate-100 rounded mb-2" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
