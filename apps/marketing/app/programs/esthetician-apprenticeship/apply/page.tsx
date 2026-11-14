import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import BeautyApplicationChoice from '@/components/apply/BeautyApplicationChoice';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply — Esthetician Apprenticeship',
  description: `Apply to the ${PLATFORM_DEFAULTS.orgName} esthetician apprenticeship through the canonical PARIS-guided student application.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student/interview?program=esthetician-apprenticeship',
  },
  robots: { index: false, follow: false },
};

/**
 * Esthetician apprentice intake is owned by the canonical PARIS application.
 * Program availability and pricing load from the published program registry;
 * this compatibility route must not duplicate program facts, prices, or forms.
 */
export default function EstheticianApplyPage() {
  return <BeautyApplicationChoice programSlug="esthetician-apprenticeship" programTitle="Esthetician Apprenticeship Applications" />;
}
