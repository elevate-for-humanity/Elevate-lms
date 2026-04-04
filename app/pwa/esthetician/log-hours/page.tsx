import ApprenticeHoursLogger from '@/components/pwa/ApprenticeHoursLogger';

export default function EstheticianLogHoursPage() {
  return (
    <ApprenticeHoursLogger
      discipline="esthetician"
      apiPath="/api/pwa/esthetician/log-hours"
      backHref="/pwa/esthetician"
      accentColor="bg-rose-800"
    />
  );
}
