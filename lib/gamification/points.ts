import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type GamificationEventType =
  | 'community_post'
  | 'community_comment'
  | 'forum_topic'
  | 'forum_reply'
  | 'study_group_created'
  | 'study_group_joined'
  | 'event_registered'
  | 'event_attended'
  | 'lesson_completed'
  | 'quiz_completed'
  | 'course_completed'
  | 'certificate_earned'
  | 'manual';

export type LeaderboardEntry = {
  id: string;
  user_id: string;
  course_id: string | null;
  points: number;
  updated_at?: string | null;
  profile?: { id: string; full_name: string | null; avatar_url?: string | null } | null;
};

export function levelForPoints(points: number) {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (points >= thresholds[i]) level = i + 1;
  }
  const currentFloor = thresholds[Math.min(level - 1, thresholds.length - 1)] ?? 0;
  const nextFloor = thresholds[level] ?? currentFloor + 5000;
  const progress = Math.min(100, Math.max(0, Math.round(((points - currentFloor) / Math.max(1, nextFloor - currentFloor)) * 100)));
  return { level, currentFloor, nextFloor, progress };
}

/**
 * Canonical, idempotent point award. The database RPC writes the event ledger
 * and increments the appropriate global/course leaderboard in one transaction.
 */
export async function recordPointsEvent(input: {
  userId: string;
  eventType: GamificationEventType;
  sourceId?: string | null;
  courseId?: string | null;
  points: number;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const admin = await requireAdminClient();
    const { data, error } = await admin.rpc('award_gamification_points', {
      p_user_id: input.userId,
      p_event_type: input.eventType,
      p_source_id: input.sourceId ?? null,
      p_course_id: input.courseId ?? null,
      p_points: input.points,
      p_metadata: input.metadata ?? {},
    });
    if (error) {
      logger.error('[gamification] point award failed', error instanceof Error ? error : undefined, {
        userId: input.userId,
        eventType: input.eventType,
        sourceId: input.sourceId,
      });
      return false;
    }
    return data === true;
  } catch (error) {
    logger.error('[gamification] point award unavailable', error instanceof Error ? error : undefined, {
      userId: input.userId,
      eventType: input.eventType,
    });
    return false;
  }
}

/** Backward-compatible point API for older callers. */
export async function addPoints(userId: string, courseId: string | null, points: number) {
  return recordPointsEvent({ userId, courseId, points, eventType: 'manual' });
}

async function hydrateProfiles(rows: any[]): Promise<LeaderboardEntry[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
    : { data: [] as any[] };
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
  return rows.map((row) => ({ ...row, profile: profileMap.get(row.user_id) ?? null })) as LeaderboardEntry[];
}

export async function getCourseLeaderboard(courseId: string, limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leaderboard_scores')
    .select('id, user_id, course_id, points, updated_at')
    .eq('course_id', courseId)
    .order('points', { ascending: false })
    .limit(limit);
  if (error) {
    logger.warn('[gamification] course leaderboard read failed', { courseId, message: error.message });
    return [];
  }
  return hydrateProfiles(data ?? []);
}

export async function getGlobalLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leaderboard_scores')
    .select('id, user_id, course_id, points, updated_at')
    .is('course_id', null)
    .order('points', { ascending: false })
    .limit(limit);
  if (error) {
    logger.warn('[gamification] global leaderboard read failed', { message: error.message });
    return [];
  }
  return hydrateProfiles(data ?? []);
}

/** Canonical badge award. user_badges already references badge_definitions. */
export async function awardBadge(userId: string, badgeKey: string): Promise<boolean> {
  try {
    const admin = await requireAdminClient();
    const { data: badge, error: badgeError } = await admin
      .from('badge_definitions')
      .select('id, key')
      .eq('key', badgeKey)
      .eq('is_active', true)
      .maybeSingle();

    if (badgeError || !badge) {
      logger.warn('[gamification] badge not found', { badgeKey, userId, message: badgeError?.message });
      return false;
    }

    const { error } = await admin.from('user_badges').upsert(
      { user_id: userId, badge_id: badge.id, awarded_at: new Date().toISOString() },
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
    );
    if (error) {
      logger.warn('[gamification] badge award failed', { badgeKey, userId, message: error.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('[gamification] badge award unavailable', error instanceof Error ? error : undefined, { badgeKey, userId });
    return false;
  }
}
