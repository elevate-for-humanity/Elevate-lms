import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordPointsEvent, type GamificationEventType } from '@/lib/gamification/points';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REWARDS: Partial<Record<GamificationEventType, number>> = {
  community_post: 10,
  community_comment: 5,
  forum_topic: 10,
  forum_reply: 5,
  study_group_created: 10,
  study_group_joined: 5,
  event_registered: 5,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { eventType?: GamificationEventType; sourceId?: string; courseId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = body.eventType;
  const sourceId = body.sourceId?.trim();
  const points = eventType ? REWARDS[eventType] : undefined;
  if (!eventType || !points || !sourceId || sourceId.length > 200) {
    return NextResponse.json({ error: 'Invalid reward event' }, { status: 400 });
  }

  const awarded = await recordPointsEvent({
    userId: user.id,
    eventType,
    sourceId,
    courseId: body.courseId ?? null,
    points,
  });

  return NextResponse.json({ ok: true, awarded, points: awarded ? points : 0 });
}
