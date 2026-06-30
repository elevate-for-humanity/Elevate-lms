import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TutoringClient from './TutoringClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Tutoring Center | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'One-on-one and small group tutoring for every program. Up to 3 sessions per week included with enrollment.',
  robots: { index: false, follow: false },
};

export default async function TutoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/tutoring');

  const { data: tutors } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'instructor')
    .limit(12);

  return <TutoringClient tutors={tutors ?? []} />;
}
