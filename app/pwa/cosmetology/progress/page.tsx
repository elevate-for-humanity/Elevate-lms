export const dynamic = 'force-static';
export const revalidate = 3600;

import ApprenticeProgress from '@/components/pwa/ApprenticeProgress';

export default function CosmetologyProgressPage() {
  return (
    <ApprenticeProgress
      discipline="cosmetology"
      apiPath="/api/pwa/cosmetology/progress"
      backHref="/pwa/cosmetology"
      accentColor="bg-purple-600"
      accentText="text-purple-700"
      accentBg="bg-purple-50"
      accentBorder="border-purple-200"
      stateBoardHref="/apprentice/state-board"
      lmsHref="/lms/dashboard"
    />
  );
}
