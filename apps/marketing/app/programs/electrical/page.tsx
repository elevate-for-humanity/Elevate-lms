import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const revalidate = 3600;

export default async function ElectricalPage() {
  const loaded = await loadProgramForPage('electrical');
  if (!loaded) return notFound();
  return <ProgramDetailPage program={loaded.program} banner={heroBanners.electrical ?? null} />;
}

export async function generateMetadata() {
  const loaded = await loadProgramForPage('electrical');
  const program = loaded?.program;
  return {
    title: program?.metaTitle ?? program?.title ?? 'Electrical Training',
    description: program?.metaDescription ?? program?.subtitle ?? '',
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/electrical' },
  };
}
