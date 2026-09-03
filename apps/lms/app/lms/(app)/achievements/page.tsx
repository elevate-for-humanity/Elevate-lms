import { Metadata } from 'next';
import Link from 'next/link';
import { Award, BookOpen, Flame, Medal, Star, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getGlobalLeaderboard, levelForPoints } from '@/lib/gamification/points';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Achievements & Points | Elevate LMS',
  description: 'Track points, levels, badges, certificates, and learning milestones.',
  robots: { index: false, follow: false },
};

function PublicAchievementsPreview() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-amber-500 to-brand-orange-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <Trophy className="mx-auto mb-4 h-16 w-16" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Progress & Recognition</p>
          <h1 className="mt-3 text-4xl font-black">Earn achievements, badges, and certificates.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Complete real learning milestones, build streaks, earn points, and collect credentials that document your progress.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-4"><Star className="mx-auto h-6 w-6" /><p className="mt-2 font-black">First Steps</p><p className="text-xs text-white/80">Start learning</p></div>
            <div className="rounded-2xl bg-white/15 p-4"><BookOpen className="mx-auto h-6 w-6" /><p className="mt-2 font-black">Course Complete</p><p className="text-xs text-white/80">Finish programs</p></div>
            <div className="rounded-2xl bg-white/15 p-4"><Flame className="mx-auto h-6 w-6" /><p className="mt-2 font-black">Learning Streaks</p><p className="text-xs text-white/80">Stay consistent</p></div>
            <div className="rounded-2xl bg-white/15 p-4"><Award className="mx-auto h-6 w-6" /><p className="mt-2 font-black">Certified</p><p className="text-xs text-white/80">Earn credentials</p></div>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login?redirect=/lms/achievements" className="rounded-xl bg-white px-6 py-3 font-black text-brand-orange-700">Sign in to view progress</Link>
            <Link href="/signup" className="rounded-xl border-2 border-white px-6 py-3 font-black text-white">Create an account</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <PublicAchievementsPreview />;

  const [profileResult, scoreResult, badgesResult, definitionsResult, certificatesResult, enrollmentsResult, quizAttemptsResult, forumPostsResult, leaderboard] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('leaderboard_scores').select('points').eq('user_id', user.id).is('course_id', null).maybeSingle(),
    supabase.from('user_badges').select('badge_id,awarded_at').eq('user_id', user.id).order('awarded_at', { ascending: false }),
    supabase.from('badge_definitions').select('id,key,name,description,icon_url,badge_type,points_reward,rarity').eq('is_active', true).order('points_reward', { ascending: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('program_enrollments').select('id,status,progress_percent').eq('user_id', user.id),
    supabase.from('quiz_attempts').select('score').eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    getGlobalLeaderboard(10),
  ]);

  const points = Number(scoreResult.data?.points ?? 0);
  const level = levelForPoints(points);
  const earnedRows = badgesResult.data ?? [];
  const earnedIds = new Set(earnedRows.map((row: any) => row.badge_id));
  const earnedAt = new Map(earnedRows.map((row: any) => [row.badge_id, row.awarded_at]));
  const definitions = definitionsResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];
  const completedPrograms = enrollments.filter((row: any) => row.status === 'completed').length;
  const activePrograms = enrollments.filter((row: any) => row.status !== 'completed').length;
  const quizAttempts = quizAttemptsResult.data ?? [];
  const perfectQuizCount = quizAttempts.filter((row: any) => Number(row.score) === 100).length;
  const highQuizCount = quizAttempts.filter((row: any) => Number(row.score) >= 90).length;
  const forumPostCount = forumPostsResult.count ?? 0;
  const name = profileResult.data?.full_name || user.email?.split('@')[0] || 'Learner';

  function progressForBadge(key: string | null | undefined, earned: boolean) {
    if (earned) return 100;
    switch (key) {
      case 'first-course':
      case 'course-complete':
        return Math.min(100, completedPrograms * 100);
      case 'course-master':
        return Math.min(100, Math.round((completedPrograms / 5) * 100));
      case 'quiz-ace':
      case 'perfect-score':
        return Math.min(100, perfectQuizCount * 100);
      case 'perfectionist':
        return Math.min(100, Math.round((highQuizCount / 10) * 100));
      case 'community-helper':
      case 'helper':
        return Math.min(100, Math.round((forumPostCount / 5) * 100));
      default:
        return null;
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Progress & Recognition</p>
        <div className="mt-3 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div><h1 className="text-3xl font-black">{name}, you are Level {level.level}.</h1><p className="mt-2 max-w-2xl text-slate-300">Points come from real learning and constructive community activity. Badges recognize milestones, not clicks.</p></div>
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-center"><div className="text-3xl font-black">{points.toLocaleString()}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-300">Total points</div></div>
        </div>
        <div className="mt-6"><div className="mb-2 flex justify-between text-xs font-bold text-slate-300"><span>Level {level.level}</span><span>{level.nextFloor.toLocaleString()} pts to next threshold</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-amber-400" style={{ width: `${level.progress}%` }} /></div></div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><BookOpen className="h-5 w-5 text-brand-blue-600" /><div className="mt-2 text-2xl font-black">{activePrograms}</div><div className="text-xs font-bold text-slate-500">Active programs</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><Trophy className="h-5 w-5 text-amber-500" /><div className="mt-2 text-2xl font-black">{completedPrograms}</div><div className="text-xs font-bold text-slate-500">Programs completed</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><Medal className="h-5 w-5 text-purple-600" /><div className="mt-2 text-2xl font-black">{earnedIds.size}</div><div className="text-xs font-bold text-slate-500">Badges earned</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><Award className="h-5 w-5 text-emerald-600" /><div className="mt-2 text-2xl font-black">{certificatesResult.count ?? 0}</div><div className="text-xs font-bold text-slate-500">Certificates</div></div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-4 flex items-end justify-between"><div><h2 className="text-2xl font-black text-slate-950">Badges</h2><p className="text-sm text-slate-600">One canonical badge system powers onboarding, learning, credentials, career milestones, and community recognition.</p></div><Link href="/lms/progress" className="text-sm font-black text-brand-blue-700">View detailed progress</Link></div>
          <div className="grid gap-4 md:grid-cols-2">{definitions.map((badge: any) => {
            const earned = earnedIds.has(badge.id);
            const badgeProgress = progressForBadge(badge.key, earned);
            return <article key={badge.id} className={`rounded-2xl border p-5 ${earned ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}><div className="flex items-start gap-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${earned ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'}`}><Star className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{badge.name}</h3><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">{badge.rarity || 'common'}</span></div><p className="mt-1 text-sm leading-5 text-slate-600">{badge.description}</p>{badgeProgress !== null && !earned && <div className="mt-3"><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-500"><span>Progress</span><span>{badgeProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-600" style={{ width: `${badgeProgress}%` }} /></div></div>}<div className="mt-3 flex items-center justify-between text-xs font-bold"><span className={earned ? 'text-emerald-700' : 'text-slate-500'}>{earned ? `Earned ${new Date(earnedAt.get(badge.id) as string).toLocaleDateString()}` : 'Not earned yet'}</span><span className="text-amber-700">+{badge.points_reward ?? 0} pts</span></div></div></div></article>;
          })}</div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><h2 className="font-black">Leaderboard</h2></div><p className="mt-1 text-sm text-slate-600">Global points across learning and community activity.</p><div className="mt-4 divide-y divide-slate-100">{leaderboard.map((row, index) => <div key={row.user_id} className="flex items-center gap-3 py-3"><div className="w-7 text-center text-sm font-black text-slate-500">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{row.profile?.full_name || 'Learner'}</p><p className="text-xs text-slate-500">Level {levelForPoints(row.points).level}</p></div><div className="text-sm font-black">{row.points} pts</div></div>)}{!leaderboard.length && <p className="py-6 text-center text-sm text-slate-500">Leaderboard activity starts when learners earn points.</p>}</div></aside>
      </div>
    </main>
  );
}
