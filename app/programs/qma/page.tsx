export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { QMA } from '@/data/programs/qma';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: QMA.metaTitle ?? `${QMA.title} | ${PLATFORM_DEFAULTS.orgName}`,
  description: QMA.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/qma' },
};

export default function QMAPage() {
  return <ProgramDetailPage program={QMA} />;
}
