export const dynamic = 'force-static';
export const revalidate = 3600;

import ApprenticeProgress from '@/components/pwa/ApprenticeProgress';

export default function NailTechProgressPage() {
  return (
    <ApprenticeProgress
      discipline="nail-tech"
      apiPath="/api/pwa/nail-tech/progress"
      backHref="/pwa/nail-tech"
      accentColor="bg-pink-600"
      accentText="text-pink-700"
      accentBg="bg-pink-50"
      accentBorder="border-pink-200"
      stateBoardHref="/apprentice/state-board"
      lmsHref="/lms/dashboard"
    />
  );
}
