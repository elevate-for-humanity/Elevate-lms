import { FormLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <FormLoadingSkeleton />
    </div>
  );
}
