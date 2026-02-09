import { TableLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function BillingLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <TableLoadingSkeleton />
      </div>
    </div>
  );
}
