// POST /api/courses/[courseId]/reviews/[reviewId]/helpful
// Increments helpful_count on a course review. One vote per user per review
// enforced via upsert on (review_id, user_id) in review_helpful_votes.
// Falls back to a raw increment if the votes table doesn't exist yet.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; reviewId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reviewId } = await params;

  // Try votes table first (deduplication)
  const { error: voteError } = await supabase
    .from('review_helpful_votes')
    .upsert(
      { review_id: reviewId, user_id: user.id },
      { onConflict: 'review_id,user_id', ignoreDuplicates: true }
    );

  if (!voteError) {
    // Recount from votes table to keep helpful_count accurate
    const { count } = await supabase
      .from('review_helpful_votes')
      .select('id', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    await supabase
      .from('course_reviews')
      .update({ helpful_count: count ?? 0 })
      .eq('id', reviewId);
  } else {
    // Votes table not yet applied — increment directly (no dedup)
    const { data: review } = await supabase
      .from('course_reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .maybeSingle();

    if (review) {
      await supabase
        .from('course_reviews')
        .update({ helpful_count: (review.helpful_count ?? 0) + 1 })
        .eq('id', reviewId);
    }
  }

  return NextResponse.json({ ok: true });
}
