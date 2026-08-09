import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function EstheticianApprenticeshipPage() {
  const loaded = await loadProgramForPage('esthetician-apprenticeship');
  if (!loaded) return notFound();
  const p = loaded.program;
  const banner = heroBanners['esthetician-apprenticeship'] ?? null;
  return <ProgramDetailPage program={p} banner={banner} />;
}

export async function generateMetadata() {
  return {
    title: 'Esthetician Apprenticeship | Esthetics Earn-While-You-Learn',
    description:
      'Esthetician apprenticeship pathway with supervised on-the-job learning, related technical instruction, approved training sites, progress tracking and apprenticeship sponsor oversight.',
    keywords: [
      'esthetician apprenticeship',
      'esthetics apprenticeship',
      'esthetician apprenticeship Indiana',
      'paid esthetician apprenticeship',
      'spa apprenticeship',
      'esthetician training',
      'esthetics training',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship' },
  };
}