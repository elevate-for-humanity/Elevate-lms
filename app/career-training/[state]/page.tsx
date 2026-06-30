import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStateConfig } from '@/config/states';
import { StateCareerTrainingPage } from '@/components/templates';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) return {};
  return {
    title: `${state.careerTraining.headline} | ${PLATFORM_DEFAULTS.orgName}`,
    description: state.careerTraining.description,
    alternates: {
      canonical: `${PLATFORM_DEFAULTS.siteUrl}/career-training-${state.slug}`,
    },
    openGraph: {
      title: `${state.careerTraining.headline} | ${PLATFORM_DEFAULTS.orgName}`,
      description: state.careerTraining.description,
      url: `${PLATFORM_DEFAULTS.siteUrl}/career-training-${state.slug}`,
      siteName: PLATFORM_DEFAULTS.orgName,
      images: [
        { url: '/og-default.webp', width: 1200, height: 630, alt: `${state.name} Career Training` },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${state.careerTraining.headline} | ${PLATFORM_DEFAULTS.orgName}`,
      description: state.careerTraining.description,
      images: ['/og-default.webp'],
    },
  };
}

export default async function CareerTrainingStatePage({ params }: Props) {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) notFound();
  return <StateCareerTrainingPage state={state} />;
}
