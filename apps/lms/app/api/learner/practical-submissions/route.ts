import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { submitCoursePractical } from '@/lib/lms/course-practical-workflow';

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
  let query = db
    .from('course_practical_submissions')
    .select('*,course_practical_reviews(*)')
    .eq('learner_id', user.id)
    .eq('lesson_id', lessonId);
  const interactionId = request.nextUrl.searchParams.get('interactionId');
  if (interactionId) query = query.eq('interaction_id', interactionId);
  const result = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();
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
  try {
    const submission = await submitCoursePractical(db, user.id, parsed.data);
    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unable to submit practical evidence';
    return NextResponse.json({ error: message }, { status: message.startsWith('PRACTICAL_') ? 409 : 500 });
  }
}
