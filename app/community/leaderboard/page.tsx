import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Medal, Crown, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Leaderboard | Community | Elevate For Humanity',
  description: 'See top contributors and track your progress on the community leaderboard.',
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1><p className="text-gray-600">Please try again later.</p></div></div>;

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch top learners from real data
  const { data: topLearners } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, points, role')
    .order('points', { ascending: false })
    .limit(50);

  // Get current user's rank and points if logged in
  let userRank = -1;
  let userPoints = 0;
  if (user && topLearners) {
    userRank = topLearners.findIndex(l => l.id === user.id);
    const userProfile = topLearners.find(l => l.id === user.id);
    userPoints = userProfile?.points || 0;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">#{rank}</span>;
  };

  const getInitial = (name: string | null) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  // Ensure we have at least 3 for podium display
  const hasEnoughForPodium = topLearners && topLearners.length >= 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Leaderboard' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/community-page-3.jpg" alt="Community Leaderboard" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Top 3 Podium */}
      {hasEnoughForPodium && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-slate-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 border-4 border-gray-300">
                  {getInitial(topLearners![1]?.full_name)}
                </div>
                <p className="font-bold text-gray-900">{topLearners![1]?.full_name || 'Learner'}</p>
                <p className="text-gray-500 text-sm">{(topLearners![1]?.points || 0).toLocaleString()} pts</p>
                <div className="mt-4 w-24 h-32 bg-gray-200 rounded-t-lg mx-auto flex items-center justify-center">
                  <Medal className="w-10 h-10 text-gray-400" />
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center -mt-8">
                <div className="relative">
                  <Crown className="w-8 h-8 text-yellow-500 absolute -top-8 left-1/2 -translate-x-1/2" />
                  <div className="w-24 h-24 rounded-full bg-yellow-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 border-4 border-yellow-400">
                    {getInitial(topLearners![0]?.full_name)}
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-lg">{topLearners![0]?.full_name || 'Learner'}</p>
                <p className="text-gray-500">{(topLearners![0]?.points || 0).toLocaleString()} pts</p>
                <div className="mt-4 w-28 h-44 bg-yellow-400 rounded-t-lg mx-auto flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-yellow-700" />
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-brand-orange-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 border-4 border-amber-500">
                  {getInitial(topLearners![2]?.full_name)}
                </div>
                <p className="font-bold text-gray-900">{topLearners![2]?.full_name || 'Learner'}</p>
                <p className="text-gray-500 text-sm">{(topLearners![2]?.points || 0).toLocaleString()} pts</p>
                <div className="mt-4 w-24 h-24 bg-amber-500 rounded-t-lg mx-auto flex items-center justify-center">
                  <Medal className="w-10 h-10 text-amber-200" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Full Leaderboard */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">All Rankings</h2>
          
          {topLearners && topLearners.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {topLearners.map((learner: any, index: number) => (
                <div
                  key={learner.id}
                  className={`flex items-center gap-4 p-4 ${
                    index !== topLearners.length - 1 ? 'border-b border-gray-100' : ''
                  } ${index < 3 ? 'bg-yellow-50/50' : ''} ${
                    user && learner.id === user.id ? 'bg-brand-green-50' : ''
                  }`}
                >
                  <div className="w-10 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-brand-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {getInitial(learner.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{learner.full_name || 'Learner'}</p>
                    <p className="text-gray-500 text-sm capitalize">{learner.role || 'Student'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{(learner.points || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">points</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No rankings yet</h3>
              <p className="text-gray-600 mb-6">Be the first to earn points and claim the top spot!</p>
              <Link 
                href="/programs" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700"
              >
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Climb the Ranks?</h2>
          <p className="text-yellow-100 mb-8 max-w-2xl mx-auto">
            Complete courses, log OJT hours, and earn certifications to gain points.
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-orange-600 font-semibold rounded-full hover:bg-brand-orange-50 transition-colors"
          >
            Browse Programs
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
