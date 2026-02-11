export default function EmployerLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="h-4 w-48 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-8 w-64 bg-slate-700 rounded mb-4" />
          <div className="h-12 w-96 bg-slate-700 rounded mb-4" />
          <div className="h-6 w-80 bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}
