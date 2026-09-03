import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/community');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">Community groups</p>
          <p className="mt-1 text-sm text-slate-600">
            Join study groups, cohorts, career circles, and professional interest groups.
          </p>
        </div>
        <Link
          href="/lms/groups"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-700"
        >
          <Users className="h-4 w-4" /> Browse groups
        </Link>
      </div>
      <SocialLearningCommunity
        userId={user.id}
        userName={profile?.full_name ?? user.email?.split('@')[0] ?? 'Learner'}
      />
    </main>
  );
}
