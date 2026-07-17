import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Trophy,
  Medal,
  Award,
  Star,
  TrendingUp,
  BookOpen,
  Target,
  Crown,
  Flame,
  Users,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/leaderboard' },
  title: 'Leaderboard | LMS',
  description: 'See top learners and track your progress.',
};

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  streak: number;
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/leaderboard');

  // Fetch via /api/gamification/leaderboard — single consolidated query
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  let leaderboardData: LeaderboardEntry[] = [];
  try {
    const res = await fetch(`${siteUrl}/api/gamification/leaderboard?limit=50`, {
      cache: 'no-store',
      headers: { Cookie: '' }, // server-to-server — no cookie needed
    });
    if (res.ok) {
      const d = await res.json();
      leaderboardData = (d.leaderboard ?? d.data ?? []).map((e: any) => ({
        userId: e.user_id ?? e.userId,
        name: e.name ?? e.full_name ?? 'Anonymous Learner',
        avatarUrl: e.avatar_url ?? e.avatarUrl ?? null,
        points: e.points ?? e.total_points ?? 0,
        coursesCompleted: e.courses_completed ?? e.coursesCompleted ?? 0,
        lessonsCompleted: e.lessons_completed ?? e.lessonsCompleted ?? 0,
        quizzesPassed: e.quizzes_passed ?? e.quizzesPassed ?? 0,
        streak: e.streak ?? 0,
      }));
    }
  } catch {
    // API unreachable during SSR — leaderboard shows empty state
  }

  // Fallback: build minimal map so the rest of the page renders
  const leaderboardMap = new Map<string, LeaderboardEntry>(
    leaderboardData.map((e) => [e.userId, e])
  );

  // Shim: keep legacy code path working with empty profile seed
  const profiles: any[] = [];
  profiles?.forEach((profile) => {
    leaderboardMap.set(profile.id, {
      userId: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous Learner',
      avatarUrl: profile.avatar_url,
      points: 0,
      coursesCompleted: 0,
      lessonsCompleted: 0,
      quizzesPassed: 0,
      streak: 0,
    });
  });

  // Leaderboard already sorted and scored by /api/gamification/leaderboard
  const leaderboard = leaderboardData.length > 0
    ? leaderboardData
    : Array.from(leaderboardMap.values())
        .filter((entry) => entry.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 50);

  // Find current user's rank
  const currentUserEntry = leaderboardMap.get(user.id);
  const currentUserRank = leaderboard.findIndex((e) => e.userId === user.id) + 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-700" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return (
      <span className="w-6 h-6 flex items-center justify-center text-slate-500 font-bold">
        {rank}
      </span>
    );
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-white border-slate-200';
    if (rank === 3) return 'bg-brand-orange-50 border-amber-200';
    return 'bg-white border-slate-200';
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'My Programs', href: '/lms/courses' }, { label: 'Leaderboard' }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="text-slate-600 mt-2">
            Top learners ranked by points earned through courses, quizzes, and achievements
          </p>
        </div>

        {/* Current User Stats */}
        {currentUserEntry && currentUserEntry.points > 0 && (
          <div className="bg-brand-blue-600 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  {currentUserEntry.avatarUrl ? (
                    // IMAGE-CONTRACT: allow raw img because avatarUrl is a user-supplied external URL incompatible with next/image domain config
                    <img
                      src={currentUserEntry.avatarUrl}
                      alt={currentUserEntry.name || 'Your avatar'}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {currentUserEntry.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-brand-blue-100 text-sm">Your Ranking</p>
                  <p className="text-2xl font-bold">{currentUserEntry.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black">#{currentUserRank || '—'}</div>
                <div className="text-brand-blue-100">
                  {currentUserEntry.points.toLocaleString()} points
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentUserEntry.coursesCompleted}</div>
                <div className="text-xs text-brand-blue-100">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentUserEntry.lessonsCompleted}</div>
                <div className="text-xs text-brand-blue-100">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentUserEntry.quizzesPassed}</div>
                <div className="text-xs text-brand-blue-100">Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentUserEntry.streak}</div>
                <div className="text-xs text-brand-blue-100">Day Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Top Learners</h2>
          </div>

          {leaderboard.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.userId === user.id;

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 ${getRankBg(rank)} ${
                      isCurrentUser ? 'ring-2 ring-brand-blue-500 ring-inset' : ''
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>

                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                      {entry.avatarUrl ? (
                        // IMAGE-CONTRACT: allow raw img because avatarUrl is a user-supplied external URL incompatible with next/image domain config
                        <img
                          src={entry.avatarUrl}
                          alt={entry.name || 'Learner avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-slate-400">
                          {entry.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {entry.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {entry.coursesCompleted} courses
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {entry.quizzesPassed} quizzes
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold text-slate-900">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Rankings Yet</h3>
              <p className="text-slate-600 mb-6">
                Be the first to earn points by completing courses and quizzes!
              </p>
              <Link
                href="/lms/courses"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
              >
                <BookOpen className="w-5 h-5" />
                Start Learning
              </Link>
            </div>
          )}
        </div>

        {/* How Points Work */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">How to Earn Points</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">+100</div>
                <div className="text-xs text-slate-500">Complete a course</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">+10</div>
                <div className="text-xs text-slate-500">Complete a lesson</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">+0-50</div>
                <div className="text-xs text-slate-500">Quiz score bonus</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award aria-label="award" className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">+25</div>
                <div className="text-xs text-slate-500">Earn a badge</div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
