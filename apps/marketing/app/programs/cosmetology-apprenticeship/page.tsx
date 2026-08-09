import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const revalidate = 3600;

export default async function CosmetologyApprenticeshipPage() {
  const loaded = await loadProgramForPage('cosmetology-apprenticeship');
  if (!loaded) return notFound();
  return (
    <ProgramDetailPage
      program={loaded.program}
      banner={heroBanners['cosmetology-apprenticeship'] ?? null}
    />
  );
}

export async function generateMetadata() {
  return {
    title: 'Cosmetology & Hair Stylist Apprenticeship | Earn While You Learn',
    description:
      'Cosmetology and hair stylist apprenticeship pathway with structured on-the-job learning, related technical instruction, employer training sites, progress tracking and apprenticeship sponsor oversight.',
    keywords: [
      'cosmetology apprenticeship',
      'hair stylist apprenticeship',
      'hairstylist apprenticeship',
      'cosmetology apprenticeship Indiana',
      'paid cosmetology apprenticeship',
      'salon apprenticeship',
      'cosmetology training',
    ],
    alternates: {
      canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
    },
  };
}