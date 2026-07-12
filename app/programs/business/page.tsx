import { Metadata } from 'next';
import { getPublicProgramsPageData } from '@/lib/programs/public-programs-page';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Business & Finance Programs',
  description:
    'Business and finance programs including Bookkeeping, Project Management, Office Administration, and more. WIOA funding available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/business',
  },
};

const BUSINESS_SLUGS = [
  'bookkeeping',
  'business-administration',
  'office-administration',
  'project-management',
  'entrepreneurship',
  'hospitality',
];

export default async function BusinessPage() {
  const { programs } = await getPublicProgramsPageData();
  const businessPrograms = programs.filter(
    (p) => BUSINESS_SLUGS.includes(p.slug) || p.category?.toLowerCase() === 'business'
  );

  if (businessPrograms.length === 0) {
    redirect('/programs');
  }

  // For now, redirect to main programs page
  // TODO: Create BusinessPageClient similar to HealthcarePageClient
  redirect('/programs');
}
