import { Metadata } from 'next';
import { getPublicProgramsPageData } from '@/lib/programs/public-programs-page';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Beauty & Cosmetology Programs',
  description:
    'Beauty and cosmetology programs including Barber Apprenticeship, Cosmetology Apprenticeship, Esthetician, and more. DOL-registered apprenticeships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/beauty',
  },
};

const BEAUTY_SLUGS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
  'beauty-career-educator',
  'culinary-apprenticeship',
];

export default async function BeautyPage() {
  const { programs } = await getPublicProgramsPageData();
  const beautyPrograms = programs.filter(
    (p) => BEAUTY_SLUGS.includes(p.slug) || p.category?.toLowerCase() === 'beauty'
  );

  if (beautyPrograms.length === 0) {
    redirect('/programs');
  }

  // For now, redirect to main programs page
  // TODO: Create BeautyPageClient similar to HealthcarePageClient
  redirect('/programs');
}
