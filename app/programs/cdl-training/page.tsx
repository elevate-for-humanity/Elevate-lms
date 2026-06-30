export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { CDL_TRAINING } from '@/data/programs/cdl-training';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import CdlEnrollmentOpenBanner from '@/components/programs/CdlEnrollmentOpenBanner';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: CDL_TRAINING.metaTitle ?? `${CDL_TRAINING.title} | ${PLATFORM_DEFAULTS.orgName}`,
  description: CDL_TRAINING.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cdl-training' },
};

export default function CDLTrainingPage() {
  return (
    <ProgramDetailPage program={CDL_TRAINING} announcement={<CdlEnrollmentOpenBanner />} />
  );
}
