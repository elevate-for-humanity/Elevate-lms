import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const SubmissionSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  interactionId: z.string().min(1).max(240),
  competencyKeys: z.array(z.string().min(1).max(160)).min(1).max(50),
  evidence: z
    .array(z.object({ type: z.enum(['url', 'text', 'file']), value: z.string().min(1).max(4000) }))
    .min(1)
    .max(20),
  learnerAttestation: z.literal(true),
});

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const lessonId = request.nextUrl.searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
  const db = await createClient();
  const result = await db
    .from('course_practical_submissions')
    .select('*,course_practical_reviews(*)')
    .eq('learner_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (result.error)
    return NextResponse.json({ error: 'Unable to load practical submission' }, { status: 500 });
  return NextResponse.json({ submission: result.data });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = SubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Valid evidence, competencies, and attestation are required' },
      { status: 400 },
    );
  const db = await createClient();
  const { courseId, lessonId, interactionId, competencyKeys, evidence, learnerAttestation } =
    parsed.data;
  const { data: lesson } = await db
    .from('course_lessons')
    .select('id,course_id,content_json')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  const row = {
    learner_id: user.id,
    course_id: courseId,
    lesson_id: lessonId,
    interaction_id: interactionId,
    competency_keys: competencyKeys,
    evidence,
    learner_attestation: learnerAttestation,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const saved = await db
    .from('course_practical_submissions')
    .upsert(row, { onConflict: 'learner_id,lesson_id,interaction_id' })
    .select()
    .single();
  if (saved.error)
    return NextResponse.json({ error: 'Unable to submit practical evidence' }, { status: 500 });
  await db
    .from('learning_action_events')
    .insert({
      learner_id: user.id,
      course_id: courseId,
      lesson_id: lessonId,
      action: 'request_expert_review',
      source_type: 'practical_submission',
      source_id: saved.data.id,
      payload: { competencyKeys },
    });
  return NextResponse.json({ success: true, submission: saved.data }, { status: 201 });
}
