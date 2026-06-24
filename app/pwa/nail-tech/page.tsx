export const dynamic = 'force-static';
export const revalidate = 3600;

import ApprenticeHome from '@/components/pwa/ApprenticeHome';

export default function NailTechPWAHome() {
  return <ApprenticeHome discipline="nail-tech" />;
}
