// Full-screen centered blue spinner used as a loading boundary for top-level
// route segments (funding, employer, onboarding, instructor).
// Distinct from LoadingFallback which uses a red spinner and min-h-[60vh].
export default function FullScreenSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
    </div>
  );
}
