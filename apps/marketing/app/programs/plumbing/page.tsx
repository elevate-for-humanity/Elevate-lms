import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const revalidate = 3600;

export default async function PlumbingPage() {
  const loaded = await loadProgramForPage('plumbing');
  if (!loaded) return notFound();
  return <ProgramDetailPage program={loaded.program} banner={heroBanners.plumbing ?? null} />;
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage('plumbing');
  const program = loaded?.program;
  return {
    title: program?.metaTitle ?? program?.title ?? 'Plumbing Training',
    description: program?.metaDescription ?? program?.subtitle ?? '',
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/plumbing' },
  };
}
