export const dynamic = 'force-dynamic';
export const revalidate = 3600;

import ApprenticeHome from '@/components/pwa/ApprenticeHome';

export default function NailTechPWAHome() {
  return <ApprenticeHome discipline="nail-tech" />;
}
