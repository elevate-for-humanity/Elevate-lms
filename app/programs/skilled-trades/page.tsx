import { Metadata } from 'next';
import SkilledTradesPageClient from './SkilledTradesPageClient';
import { getPublicProgramsPageData } from '@/lib/programs/public-programs-page';
import type { Program } from '@/lib/lms/types';

export const metadata: Metadata = {
  title: 'Skilled Trades Training Programs',
  description:
    'Skilled trades programs including HVAC, Electrical, Plumbing, Welding, CDL, and more. Funding available through WIOA and state grants.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/skilled-trades',
  },
};

// Skilled trades category slugs
const TRADES_SLUGS = [
  'hvac-technician',
  'hvac',
  'electrical',
  'plumbing',
  'welding',
  'cdl-training',
  'cdl',
  'construction-trades',
  'diesel-mechanic',
  'forklift',
  'building-services',
  'automotive-technician',
  'solar-panel-installation',
  'manufacturing-technician',
  'building-maintenance',
];

export default async function SkilledTradesPage() {
  const { programs } = await getPublicProgramsPageData();
  
  // Filter to skilled trades programs
  const tradesPrograms: Program[] = programs.filter(
    (p) => TRADES_SLUGS.includes(p.slug) || p.category === 'trades' || p.category === 'skilled-trades'
  );

  return <SkilledTradesPageClient programs={tradesPrograms} />;
}
