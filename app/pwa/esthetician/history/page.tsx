import ApprenticeHoursHistory from '@/components/pwa/ApprenticeHoursHistory';

export default function EstheticianHoursHistoryPage() {
  return (
    <ApprenticeHoursHistory
      discipline="esthetician"
      apiPath="/api/pwa/esthetician/hours-history"
      backHref="/pwa/esthetician"
      accentColor="bg-rose-600"
      accentText="text-rose-700"
      accentBg="bg-rose-50"
    />
  );
}
