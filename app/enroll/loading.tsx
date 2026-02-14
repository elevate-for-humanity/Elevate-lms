export default function EnrollLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-slate-300 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="h-10 w-64 bg-slate-400 rounded mx-auto mb-4" />
          <div className="h-6 w-96 bg-slate-400/70 rounded mx-auto" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="h-7 w-48 bg-slate-200 rounded mb-6" />
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-full max-w-md bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                  </div>
                  <div className="ml-4">
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-blue-50 rounded-xl p-6">
          <div className="h-5 w-24 bg-brand-blue-200 rounded mb-3" />
          <div className="h-4 w-full max-w-sm bg-brand-blue-100 rounded mb-4" />
          <div className="flex gap-4">
            <div className="h-10 w-36 bg-brand-blue-200 rounded-lg" />
            <div className="h-10 w-28 bg-brand-blue-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
