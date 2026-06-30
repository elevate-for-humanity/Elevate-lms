export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProgramConfig } from '@/lib/partners/program-config';
import UniversalPartnerLanding from './UniversalPartnerLanding';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  const config = getProgramConfig(program);
  if (!config) return { title: 'Program Not Found' };

  return {
    title: `${config.shortName} Partner Program | ${PLATFORM_DEFAULTS.orgName}`,
    description: config.description,
    alternates: {
      canonical: `${PLATFORM_DEFAULTS.siteUrl}/partners/programs/${program}`,
    },
    openGraph: {
      title: `${config.shortName} Partner Program`,
      description: config.description,
      url: `${PLATFORM_DEFAULTS.siteUrl}/partners/programs/${program}`,
    },
  };
}

export default async function ProgramPartnerPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const config = getProgramConfig(program);
  if (!config) notFound();

  return <UniversalPartnerLanding config={config} />;
}
