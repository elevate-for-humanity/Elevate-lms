import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import BeautyApplicationChoice from '@/components/apply/BeautyApplicationChoice';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply — Cosmetology Apprenticeship',
  description: `Apply to the ${PLATFORM_DEFAULTS.orgName} cosmetology apprenticeship through the canonical PARIS-guided student application.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student/interview?program=cosmetology-apprenticeship',
  },
  robots: { index: false, follow: false },
};

/**
 * Cosmetology apprentice intake is owned by the canonical PARIS application.
 * Program availability and titles load from the published program registry;
 * this compatibility route must not duplicate program facts, prices, or forms.
 */
export default function CosmetologyApplyPage() {
  return <BeautyApplicationChoice programSlug="cosmetology-apprenticeship" programTitle="Cosmetology Apprenticeship Applications" />;
}
