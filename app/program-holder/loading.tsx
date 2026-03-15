export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-blue-600 border-r-transparent mb-4" />
        <p className="text-black font-medium">Loading...</p>
      </div>
    </div>
  );
}
