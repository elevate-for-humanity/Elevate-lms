import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SocialLearningCommunity from '@/components/SocialLearningCommunity';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Community | Elevate LMS',
  description: 'Connect with learners, study groups, discussions, and community leaders.',
  robots: { index: false, follow: false },
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/community');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <SocialLearningCommunity userId={user.id} userName={profile?.full_name ?? user.email?.split('@')[0] ?? 'Learner'} />
    </main>
  );
}
