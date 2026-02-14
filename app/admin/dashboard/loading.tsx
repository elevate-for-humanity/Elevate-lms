export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue-600 mb-4"></div>
        <p className="text-lg text-black font-medium">
          Loading admin dashboard...
        </p>
      </div>
    </div>
  );
}
