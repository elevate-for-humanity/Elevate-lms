import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStateConfig, STATE_SLUGS } from '@/config/states';
import { StateCareerTrainingPage } from '@/components/templates';

interface Props {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  return STATE_SLUGS.map((state) => ({ state }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) return {};
  return {
    title: `${state.careerTraining.headline} | Elevate for Humanity`,
    description: state.careerTraining.description,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/career-training-${state.slug}`,
    },
    openGraph: {
      title: `${state.careerTraining.headline} | Elevate for Humanity`,
      description: state.careerTraining.description,
      url: `https://www.elevateforhumanity.org/career-training-${state.slug}`,
      siteName: 'Elevate for Humanity',
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: `${state.name} Career Training` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${state.careerTraining.headline} | Elevate for Humanity`,
      description: state.careerTraining.description,
      images: ['/og-default.jpg'],
    },
  };
}

export default async function CareerTrainingStatePage({ params }: Props) {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) notFound();
  return <StateCareerTrainingPage state={state} />;
}
