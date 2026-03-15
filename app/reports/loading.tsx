import { TableLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <TableLoadingSkeleton />
      </div>
    </div>
  );
}
