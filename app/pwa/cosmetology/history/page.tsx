export const dynamic = 'force-static';
export const revalidate = 3600;

import ApprenticeHoursHistory from '@/components/pwa/ApprenticeHoursHistory';

export default function CosmetologyHoursHistoryPage() {
  return (
    <ApprenticeHoursHistory
      discipline="cosmetology"
      apiPath="/api/pwa/cosmetology/hours-history"
      backHref="/pwa/cosmetology"
      accentColor="bg-purple-600"
      accentText="text-purple-700"
      accentBg="bg-purple-50"
    />
  );
}
