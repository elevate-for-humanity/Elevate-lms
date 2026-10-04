import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { practicalReviewerCourseIds, reviewCoursePractical } from '@/lib/lms/course-practical-workflow';

const ReviewSchema = z.object({
  submissionId: z.string().uuid(),
  decision: z.enum(['approved', 'revision_required', 'rejected']),
  competencyResults: z.record(z.string(), z.boolean()),
  comments: z.string().min(3).max(4000),
});

async function reviewer() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = await requireAdminClient();
  try { return { db, user, courseIds: await practicalReviewerCourseIds(db, user.id) }; }
  catch { return null; }
}

export async function GET() {
  const actor = await reviewer();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let query = actor.db
    .from('course_practical_submissions')
    .select('*,course_practical_reviews(*)')
    .in('status', ['submitted', 'in_review'])
    .order('submitted_at');
  if (actor.courseIds) {
    if (!actor.courseIds.length) return NextResponse.json({ submissions: [] });
    query = query.in('course_id', actor.courseIds);
  }
  const result = await query;
  if (result.error)
    return NextResponse.json({ error: 'Unable to load review queue' }, { status: 500 });
  return NextResponse.json({ submissions: result.data });
}

export async function POST(request: NextRequest) {
  const actor = await reviewer();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = ReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid practical review' }, { status: 400 });
  try {
    const result = await reviewCoursePractical(actor.db, actor.user.id, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unable to save practical review';
    return NextResponse.json({ error: message }, { status: message === 'PRACTICAL_REVIEW_FORBIDDEN' ? 403 : message.startsWith('PRACTICAL_') ? 409 : 500 });
  }
}
