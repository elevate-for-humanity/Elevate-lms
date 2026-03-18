export default function Loading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Hero skeleton */}
      <div className="relative bg-brand-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-10 w-64 bg-white rounded mb-2" />
          <div className="h-6 w-96 bg-white rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-5 h-5 bg-slate-200 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-20 bg-slate-200 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        </div>

        {/* Course grid skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 bg-slate-200" />
              <div className="p-6">
                <div className="h-5 w-16 bg-white rounded mb-2" />
                <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-full bg-white rounded mb-4" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
