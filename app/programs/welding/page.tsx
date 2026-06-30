export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { WELDING } from '@/data/programs/welding';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: WELDING.metaTitle ?? `${WELDING.title} | ${PLATFORM_DEFAULTS.orgName}`,
  description: WELDING.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/welding' },
};

export default function WeldingPage() {
  return <ProgramDetailPage program={WELDING} />;
}
