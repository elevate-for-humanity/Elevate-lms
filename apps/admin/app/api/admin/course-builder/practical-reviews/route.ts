import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';

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
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return profile &&
    ['admin', 'super_admin', 'org_admin', 'instructor', 'staff'].includes(profile.role)
    ? { db, user }
    : null;
}

export async function GET() {
  const actor = await reviewer();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await actor.db
    .from('course_practical_submissions')
    .select('*,course_practical_reviews(*)')
    .in('status', ['submitted', 'in_review'])
    .order('submitted_at');
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
  const { data: submission } = await actor.db
    .from('course_practical_submissions')
    .select('*')
    .eq('id', parsed.data.submissionId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  const review = await actor.db
    .from('course_practical_reviews')
    .insert({
      submission_id: submission.id,
      reviewer_id: actor.user.id,
      decision: parsed.data.decision,
      competency_results: parsed.data.competencyResults,
      comments: parsed.data.comments,
    })
    .select()
    .single();
  if (review.error) return NextResponse.json({ error: 'Unable to save review' }, { status: 500 });
  await actor.db
    .from('course_practical_submissions')
    .update({ status: parsed.data.decision, updated_at: new Date().toISOString() })
    .eq('id', submission.id);
  const action = parsed.data.decision === 'approved' ? 'record_mastery' : 'assign_remediation';
  await actor.db
    .from('learning_action_events')
    .insert({
      learner_id: submission.learner_id,
      course_id: submission.course_id,
      lesson_id: submission.lesson_id,
      action,
      source_type: 'practical_review',
      source_id: review.data.id,
      payload: { competencyResults: parsed.data.competencyResults, reviewerId: actor.user.id },
    });
  if (parsed.data.decision === 'approved')
    await actor.db
      .from('learning_action_events')
      .insert({
        learner_id: submission.learner_id,
        course_id: submission.course_id,
        lesson_id: submission.lesson_id,
        action: 'unlock_next',
        source_type: 'practical_review',
        source_id: review.data.id,
        payload: {},
      });
  return NextResponse.json({ success: true, review: review.data });
}
