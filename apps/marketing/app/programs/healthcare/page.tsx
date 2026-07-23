import { Metadata } from 'next';
import HealthcarePageClient from './HealthcarePageClient';
import { getPublicProgramsPageData } from '@/lib/programs/public-programs-page';
import type { Program } from '@/lib/lms/types';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs',
  description:
    'Healthcare training programs including CNA (FSSA IMPACT funded), Medical Assistant, Phlebotomy, and more. Funding available through FSSA IMPACT and WIOA depending on program.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/healthcare',
  },
  openGraph: {
    title: 'Healthcare Training Programs',
    description:
      'Start your healthcare career with affordable training programs in Indianapolis. CNA certification starting at $1,200.',
    url: 'https://www.elevateforhumanity.org/programs/healthcare',
  },
};

// Healthcare category slugs — nha-* prefixed slugs are duplicates of real programs, excluded
const HEALTHCARE_SLUGS = [
  'cna',
  'qma',
  'phlebotomy',
  'medical-assistant',
  'peer-recovery-specialist',
  'direct-support-professional',
  'dsp-training',
  'drug-collector',
  'cpr-first-aid',
  'home-health-aide',
  'pharmacy-technician',
  'nha-billing-coding',
  'nha-patient-care-technician',
  'nha-medical-admin-assistant',
  'nha-ehr',
  'nha-ekg-technician',
];

export default async function HealthcarePage() {
  const { programs } = await getPublicProgramsPageData();
  
  // Filter to healthcare programs only
  const healthcarePrograms: Program[] = programs.filter(
    (p) => HEALTHCARE_SLUGS.includes(p.slug) || p.category === 'healthcare'
  );

  return <HealthcarePageClient programs={healthcarePrograms} />;
}
