import ApprenticeProgress from '@/components/pwa/ApprenticeProgress';

export default function EstheticianProgressPage() {
  return (
    <ApprenticeProgress
      discipline="esthetician"
      apiPath="/api/pwa/esthetician/progress"
      backHref="/pwa/esthetician"
      accentColor="bg-rose-600"
      accentText="text-rose-700"
      accentBg="bg-rose-50"
      accentBorder="border-rose-200"
      stateBoardHref="/apprentice/state-board"
      lmsHref="/lms/dashboard"
    />
  );
}
