export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { STATES } from '@/config/states';
import { StateCommunityServicesPage } from '@/components/templates';

import { createClient } from '@/lib/supabase/server';
const state = STATES.tennessee;

export const metadata: Metadata = {
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

export default async function Page() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('community_groups').select('*').limit(50);

  return <StateCommunityServicesPage state={state} />;
}
