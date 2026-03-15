import { CardGridLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CardGridLoadingSkeleton count={8} />
      </div>
    </div>
  );
}
