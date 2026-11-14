import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const revalidate = 3600;

export default async function MedicalAssistantPage() {
  const loaded = await loadProgramForPage('medical-assistant');
  if (!loaded) return notFound();
  return (
    <ProgramDetailPage program={loaded.program} banner={heroBanners['medical-assistant'] ?? null} />
  );
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage('medical-assistant');
  const program = loaded?.program;
  return {
    title: program?.metaTitle ?? program?.title ?? 'Medical Assistant',
    description: program?.metaDescription ?? program?.subtitle ?? '',
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/medical-assistant' },
  };
}
