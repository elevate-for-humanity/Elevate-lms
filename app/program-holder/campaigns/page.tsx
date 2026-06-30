import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import CampaignsClient from './CampaignsClient';
// CampaignsClient exports as ProgramOwnerCampaignsPage — imported as default

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Campaigns | Program Holder Portal',
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/program-holder/campaigns');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['program_holder', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/login');
  }

  return <CampaignsClient />;
}
