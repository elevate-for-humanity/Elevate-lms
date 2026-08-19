// pre-auth-registry: exempt - requireAuth and active enrollment are verified before every flashcard_progress write; user_id always comes from the authenticated session.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RatingSchema = z.object({ rating: z.number().int().min(1).max(5) });
const BASE_INTERVAL_DAYS: Record<number, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; cardId: string }> },
) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = RatingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'rating must be an integer from 1 to 5' }, { status: 400 });

  const { courseId, cardId } = await params;
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

  const { data: card, error: cardError } = await db
    .from('flashcards')
    .select('id,course_id')
    .eq('id', cardId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (cardError) return NextResponse.json({ error: 'Unable to verify flashcard' }, { status: 500 });
  if (!card) return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });

  const { data: previous, error: previousError } = await db
    .from('flashcard_progress')
    .select('review_count')
    .eq('user_id', user.id)
    .eq('flashcard_id', cardId)
    .maybeSingle();
  if (previousError) return NextResponse.json({ error: 'Unable to load review history' }, { status: 500 });

  const reviewCount = Number(previous?.review_count ?? 0) + 1;
  const rating = parsed.data.rating;
  const baseDays = BASE_INTERVAL_DAYS[rating] ?? 0;
  // Deterministic growth without claiming a proprietary or validated algorithm.
  const growth = rating >= 4 ? Math.min(4, Math.max(1, Math.ceil(reviewCount / 2))) : 1;
  const intervalDays = baseDays * growth;
  const now = new Date();
  const next = new Date(now.getTime() + intervalDays * 86_400_000);
  if (rating === 1) next.setTime(now.getTime() + 10 * 60_000);

  const row = {
    user_id: user.id,
    flashcard_id: cardId,
    rating,
    last_reviewed: now.toISOString(),
    next_review: next.toISOString(),
    review_count: reviewCount,
  };

  const { data, error } = await db
    .from('flashcard_progress')
    .upsert(row, { onConflict: 'user_id,flashcard_id' })
    .select('rating,last_reviewed,next_review,review_count')
    .single();
  if (error) return NextResponse.json({ error: 'Unable to save flashcard review' }, { status: 500 });

  return NextResponse.json({ success: true, progress: data, intervalDays, schedulingModel: 'deterministic mastery review' });
}
