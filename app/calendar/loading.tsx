export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-white p-6 animate-pulse" role="status" aria-label="Loading calendar">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-24 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="h-8 bg-white rounded text-center" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading calendar...</span>
    </div>
  );
}
