import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStateConfig } from '@/config/states';
import { StateCommunityServicesPage } from '@/components/templates';
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
    title: `${state.communityServices.headline} | ${PLATFORM_DEFAULTS.orgName}`,
    description: state.communityServices.description,
    alternates: {
      canonical: `${PLATFORM_DEFAULTS.siteUrl}/community-services-${state.slug}`,
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
