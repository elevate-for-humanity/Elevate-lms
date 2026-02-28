import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProgramConfig, getAllProgramSlugs } from '@/lib/partners/program-config';
import UniversalPartnerLanding from './UniversalPartnerLanding';

export async function generateStaticParams() {
  return getAllProgramSlugs().map(slug => ({ program: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ program: string }> }): Promise<Metadata> {
  const { program } = await params;
  const config = getProgramConfig(program);
  if (!config) return { title: 'Program Not Found' };

  return {
    title: `${config.shortName} Partner Program | Elevate for Humanity`,
    description: config.description,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/partners/programs/${program}`,
    },
    openGraph: {
      title: `${config.shortName} Partner Program`,
      description: config.description,
      url: `https://www.elevateforhumanity.org/partners/programs/${program}`,
    },
  };
}

export default async function ProgramPartnerPage({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;
  const config = getProgramConfig(program);
  if (!config) notFound();

  return <UniversalPartnerLanding config={config} />;
}
