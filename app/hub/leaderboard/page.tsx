import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard | Elevate Hub',
  description: 'See top learners and compete for the top spots.',
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/leaderboard');

  // Fetch top learners
  const { data: topLearners } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, points, role')
    .order('points', { ascending: false })
    .limit(50);

  // Get current user's rank
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single();

  const userRank = topLearners?.findIndex(l => l.id === user.id) ?? -1;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="text-slate-600 mt-1">Top learners in the community</p>
        </div>

        {/* User's Rank Card */}
        {userRank >= 0 && (
          <div className="bg-brand-blue-700 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-green-100 text-sm">Your Rank</p>
                <p className="text-4xl font-bold">#{userRank + 1}</p>
              </div>
              <div className="text-right">
                <p className="text-brand-green-100 text-sm">Your Points</p>
                <p className="text-4xl font-bold">{userProfile?.points || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {topLearners && topLearners.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-slate-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                {topLearners[1]?.full_name?.charAt(0) || '2'}
              </div>
              <div className="bg-slate-200 rounded-t-lg px-6 py-8">
                <Medal className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="font-bold text-slate-900 truncate max-w-[100px]">{topLearners[1]?.full_name || 'Learner'}</p>
                <p className="text-sm text-slate-600">{topLearners[1]?.points || 0} pts</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="relative">
                <Crown className="w-8 h-8 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2" />
                <div className="w-24 h-24 rounded-full bg-brand-blue-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2">
                  {topLearners[0]?.full_name?.charAt(0) || '1'}
                </div>
              </div>
              <div className="bg-yellow-100 rounded-t-lg px-8 py-12">
                <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="font-bold text-slate-900 truncate max-w-[120px]">{topLearners[0]?.full_name || 'Learner'}</p>
                <p className="text-sm text-slate-600">{topLearners[0]?.points || 0} pts</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-brand-blue-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                {topLearners[2]?.full_name?.charAt(0) || '3'}
              </div>
              <div className="bg-brand-orange-100 rounded-t-lg px-6 py-6">
                <Star className="w-6 h-6 text-brand-orange-500 mx-auto mb-2" />
                <p className="font-bold text-slate-900 truncate max-w-[100px]">{topLearners[2]?.full_name || 'Learner'}</p>
                <p className="text-sm text-slate-600">{topLearners[2]?.points || 0} pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">All Rankings</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {topLearners?.slice(3).map((learner: any, index: number) => (
              <div 
                key={learner.id} 
                className={`flex items-center gap-4 p-4 ${learner.id === user.id ? 'bg-brand-green-50' : 'hover:bg-white'}`}
              >
                <div className="w-8 text-center font-bold text-slate-500">
                  {index + 4}
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-blue-700 flex items-center justify-center text-white font-medium">
                  {learner.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{learner.full_name || 'Learner'}</p>
                  <p className="text-sm text-slate-500">{learner.role || 'Student'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{learner.points || 0}</p>
                  <p className="text-xs text-slate-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
