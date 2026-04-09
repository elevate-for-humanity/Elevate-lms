import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { parseBody } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Points awarded per activity type
const POINTS = {
  lesson_completed: 10,
  quiz_completed: 25,
  quiz_perfect: 50,   // bonus on top of quiz_completed
  course_completed: 100,
  certificate_earned: 200,
  badge_earned: 25,
} as const;

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const supabase = await createClient();

    // Run all stat queries in parallel
    const [
      lessonsResult,
      coursesResult,
      quizResult,
      certsResult,
      badgesResult,
      streakResult,
    ] = await Promise.all([
      // Completed lessons
      supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true),

      // Completed courses
      supabase
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed'),

      // Quiz attempts with scores
      supabase
        .from('quiz_attempts')
        .select('id, score, passed_at')
        .eq('user_id', user.id)
        .not('passed_at', 'is', null),

      // Certificates
      supabase
        .from('program_completion_certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Earned badges with badge details
      supabase
        .from('user_badges')
        .select('id, badge_id, earned_at, badges(id, name, description, icon, points)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false }),

      // Most recent 30 days of lesson completions for streak calculation
      supabase
        .from('lesson_progress')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false }),
    ]);

    const lessonsCompleted = lessonsResult.count ?? 0;
    const coursesCompleted = coursesResult.count ?? 0;
    const quizAttempts = quizResult.data ?? [];
    const quizzesCompleted = quizAttempts.length;
    const perfectQuizzes = quizAttempts.filter(q => q.score === 100).length;
    const certificatesEarned = certsResult.count ?? 0;
    const userBadges = badgesResult.data ?? [];
    const badgesEarned = userBadges.length;

    // Calculate learning streak (consecutive days with at least one lesson)
    let streak = 0;
    const completionDates = (streakResult.data ?? [])
      .map(r => new Date(r.completed_at!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i); // unique days

    if (completionDates.length > 0) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      // Streak starts only if activity today or yesterday
      if (completionDates[0] === today || completionDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < completionDates.length; i++) {
          const prev = new Date(completionDates[i - 1]);
          const curr = new Date(completionDates[i]);
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate total points
    const totalPoints =
      lessonsCompleted * POINTS.lesson_completed +
      quizzesCompleted * POINTS.quiz_completed +
      perfectQuizzes * POINTS.quiz_perfect +
      coursesCompleted * POINTS.course_completed +
      certificatesEarned * POINTS.certificate_earned +
      badgesEarned * POINTS.badge_earned;

    // Derive level from total points (every 500 pts = 1 level)
    const level = Math.max(1, Math.floor(totalPoints / 500) + 1);

    return NextResponse.json({
      achievements: userBadges.map((ub: any) => ({
        id: ub.id,
        badgeId: ub.badge_id,
        name: ub.badges?.name ?? 'Badge',
        description: ub.badges?.description ?? '',
        icon: ub.badges?.icon ?? 'award',
        points: ub.badges?.points ?? POINTS.badge_earned,
        earnedAt: ub.earned_at,
      })),
      stats: {
        totalPoints,
        level,
        streak,
        totalAchievements: badgesEarned,
        lessonsCompleted,
        coursesCompleted,
        quizzesCompleted,
        perfectQuizzes,
        certificatesEarned,
        badgesEarned,
      },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load achievements');
  }
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const body = await parseBody<{ achievementId?: string; points?: number }>(request);
    if (!body.achievementId) return safeError('achievementId is required', 400);

    const db = await getAdminClient();

    // Verify the badge definition exists
    const { data: badge } = await db
      .from('badges')
      .select('id, name, points')
      .eq('id', body.achievementId)
      .maybeSingle();

    if (!badge) return safeError('Badge not found', 404);

    // Prevent duplicate awards
    const { data: existing } = await db
      .from('user_badges')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_id', body.achievementId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'ALREADY_AWARDED', message: 'Badge already earned' }, { status: 409 });
    }

    const { data: awarded, error } = await db
      .from('user_badges')
      .insert({
        user_id: user.id,
        badge_id: body.achievementId,
        earned_at: new Date().toISOString(),
        awarded_at: new Date().toISOString(),
      })
      .select('id, earned_at')
      .single();

    if (error) return safeInternalError(error, 'Failed to award badge');

    return NextResponse.json({
      achievement: {
        id: awarded.id,
        badgeId: body.achievementId,
        name: badge.name,
        points: badge.points ?? body.points ?? POINTS.badge_earned,
        earnedAt: awarded.earned_at,
      },
    }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to process achievement');
  }
}

export const GET = withApiAudit('/api/achievements', _GET);
export const POST = withApiAudit('/api/achievements', _POST);
