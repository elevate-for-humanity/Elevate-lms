import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import type { Metadata } from 'next';
import StudioClientWrapper from './StudioClientWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Dev Studio | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'AI-powered course builder and content management.',
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  return <StudioClientWrapper />;
}
