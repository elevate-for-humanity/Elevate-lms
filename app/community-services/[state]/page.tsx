import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStateConfig, STATE_SLUGS } from '@/config/states';
import { StateCommunityServicesPage } from '@/components/templates';

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
    title: `${state.communityServices.headline} | Elevate for Humanity`,
    description: state.communityServices.description,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/community-services-${state.slug}`,
    },
    keywords: [
      `community services ${state.name}`,
      `job placement ${state.name}`,
      `family services ${state.majorCities[0]}`,
      `housing assistance ${state.name}`,
    ],
  };
}

export default async function CommunityServicesStatePage({ params }: Props) {
  const { state: slug } = await params;
  const state = getStateConfig(slug);
  if (!state) notFound();
  return <StateCommunityServicesPage state={state} />;
}
