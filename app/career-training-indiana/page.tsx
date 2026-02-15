import type { Metadata } from 'next';
import { STATES } from '@/config/states';
import { StateCareerTrainingPage } from '@/components/templates';

const state = STATES.indiana;

export const metadata: Metadata = {
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

export default function Page() {
  return <StateCareerTrainingPage state={state} />;
}
