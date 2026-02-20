function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="h-48 md:h-56 bg-gray-300 animate-pulse" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-6 relative z-20">
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
              <Pulse className="w-7 h-7 rounded-md mb-2" />
              <Pulse className="h-6 w-12 mb-1" />
              <Pulse className="h-3 w-16 mb-0.5" />
              <Pulse className="h-2 w-20" />
            </div>
          ))}
        </div>

        {/* Tab skeleton */}
        <Pulse className="h-9 w-64 rounded-lg mb-4" />

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <Pulse className="h-4 w-32 mb-2" />
            <Pulse className="h-3 w-48 mb-4" />
            <Pulse className="h-[220px] w-full rounded" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <Pulse className="h-4 w-28 mb-2" />
            <Pulse className="h-3 w-36 mb-3" />
            <Pulse className="h-[160px] w-full rounded-full mx-auto" style={{ maxWidth: 160 }} />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table + sidebar skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100">
              <Pulse className="h-4 w-32" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 border-b border-gray-50">
                <Pulse className="w-7 h-7 rounded-full" />
                <div className="flex-1">
                  <Pulse className="h-3 w-28 mb-1" />
                  <Pulse className="h-2 w-40" />
                </div>
                <Pulse className="h-4 w-14 rounded-full" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <Pulse className="h-4 w-20 mb-3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between mb-2">
                  <Pulse className="h-3 w-20" />
                  <Pulse className="h-4 w-12 rounded-full" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <Pulse className="h-4 w-24 mb-3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Pulse key={i} className="h-8 w-full rounded-lg mb-1.5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
