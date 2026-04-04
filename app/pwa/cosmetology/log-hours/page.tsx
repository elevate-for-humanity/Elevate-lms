import ApprenticeHoursLogger from '@/components/pwa/ApprenticeHoursLogger';

export default function CosmetologyLogHoursPage() {
  return (
    <ApprenticeHoursLogger
      discipline="cosmetology"
      apiPath="/api/pwa/cosmetology/log-hours"
      backHref="/pwa/cosmetology"
      accentColor="bg-purple-800"
    />
  );
}
