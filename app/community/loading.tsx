import { CardGridLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-40 bg-slate-200 rounded mb-6 animate-pulse" />
        <CardGridLoadingSkeleton count={6} />
      </div>
    </div>
  );
}
