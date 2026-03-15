export default function PartnerLoading() {
  return (
    <div className="min-h-screen bg-brand-blue-800 flex items-center justify-center px-4 animate-pulse">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4" />
          <div className="h-8 w-48 bg-white/20 rounded mx-auto mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded mx-auto" />
        </div>
        <div className="bg-white rounded-xl p-8">
          <div className="space-y-6">
            <div className="h-12 bg-white rounded-lg" />
            <div className="h-12 bg-white rounded-lg" />
            <div className="h-12 bg-brand-blue-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
