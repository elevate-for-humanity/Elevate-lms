import { Metadata } from 'next';
import { getPublicProgramsPageData } from '@/lib/programs/public-programs-page';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Technology Programs',
  description:
    'Technology programs including IT Help Desk, Cybersecurity, Web Development, and more. WIOA funding available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/technology',
  },
};

const TECH_SLUGS = [
  'it-help-desk',
  'cybersecurity-analyst',
  'web-development',
  'software-development',
  'network-administration',
  'graphic-design',
  'cad-drafting',
  'data-analytics',
];

export default async function TechnologyPage() {
  const { programs } = await getPublicProgramsPageData();
  const techPrograms = programs.filter(
    (p) => TECH_SLUGS.includes(p.slug) || p.category?.toLowerCase() === 'technology'
  );

  if (techPrograms.length === 0) {
    redirect('/programs');
  }

  // For now, redirect to main programs page
  // TODO: Create TechnologyPageClient similar to HealthcarePageClient
  redirect('/programs');
}
