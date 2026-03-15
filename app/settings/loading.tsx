import { FormLoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-white py-12">
      <FormLoadingSkeleton />
    </div>
  );
}
