import ApprenticeHoursHistory from '@/components/pwa/ApprenticeHoursHistory';

export default function NailTechHoursHistoryPage() {
  return (
    <ApprenticeHoursHistory
      discipline="nail-tech"
      apiPath="/api/pwa/nail-tech/hours-history"
      backHref="/pwa/nail-tech"
      accentColor="bg-pink-600"
      accentText="text-pink-700"
      accentBg="bg-pink-50"
    />
  );
}
