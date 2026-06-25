import { CardGridLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function HelpLoading() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="h-10 w-48 bg-slate-200 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-12 w-96 bg-white rounded mx-auto animate-pulse" />
        </div>
        <CardGridLoadingSkeleton count={6} />
      </div>
    </div>
  );
}
