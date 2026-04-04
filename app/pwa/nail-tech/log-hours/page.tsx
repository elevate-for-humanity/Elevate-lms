import ApprenticeHoursLogger from '@/components/pwa/ApprenticeHoursLogger';

export default function NailTechLogHoursPage() {
  return (
    <ApprenticeHoursLogger
      discipline="nail-tech"
      apiPath="/api/pwa/nail-tech/log-hours"
      backHref="/pwa/nail-tech"
      accentColor="bg-pink-800"
    />
  );
}
