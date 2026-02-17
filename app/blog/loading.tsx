import { BlogCardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-r from-brand-orange-600 to-brand-orange-500 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-10 w-64 bg-brand-orange-400 mb-4" />
          <Skeleton className="h-6 w-full max-w-xl bg-brand-orange-400" />
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
