import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId } = await params;
  const db = await createClient();
  const { data: enrollment, error: enrollmentError } = await db
    .from('course_enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Unable to verify enrollment' }, { status: 500 });
  if (!enrollment) return NextResponse.json({ error: 'Course access required' }, { status: 403 });

  const { data: cards, error: cardError } = await db
    .from('flashcards')
    .select('id,lesson_id,front,back,hint,difficulty,source')
    .eq('course_id', courseId);
  if (cardError) return NextResponse.json({ error: 'Unable to load flashcards' }, { status: 500 });

  const cardIds = (cards ?? []).map((card: any) => card.id);
  let progress: any[] = [];
  if (cardIds.length) {
    const result = await db
      .from('flashcard_progress')
      .select('flashcard_id,rating,last_reviewed,next_review,review_count')
      .eq('user_id', user.id)
      .in('flashcard_id', cardIds);
    if (result.error) return NextResponse.json({ error: 'Unable to load flashcard progress' }, { status: 500 });
    progress = result.data ?? [];
  }

  const progressMap = new Map(progress.map((row: any) => [row.flashcard_id, row]));
  const now = Date.now();
  const merged = (cards ?? []).map((card: any) => {
    const state = progressMap.get(card.id) as any;
    const nextReview = state?.next_review ? new Date(state.next_review).getTime() : null;
    return {
      ...card,
      progress: state ?? null,
      due: nextReview == null || nextReview <= now,
    };
  });
  merged.sort((a: any, b: any) => Number(b.due) - Number(a.due) || Number(a.progress?.review_count ?? 0) - Number(b.progress?.review_count ?? 0));

  return NextResponse.json({
    success: true,
    cards: merged,
    total: merged.length,
    due: merged.filter((card: any) => card.due).length,
  });
}
