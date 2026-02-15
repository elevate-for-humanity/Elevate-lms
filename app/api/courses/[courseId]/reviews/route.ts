import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient();
  const { courseId } = await params;

  const { data, error }: any = await supabase
    .from('course_reviews')
    .select(
      `
      id,
      rating,
      title,
      body,
      created_at,
      user_id
    `
    )
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Fetch user profiles for reviews
  const userIds = data?.map((r) => r.user_id) || [];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, first_name, last_name')
    .in('user_id', userIds);

  const profileMap = new Map(
    profiles?.map((p) => [
      p.user_id,
      `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Student',
    ])
  );

  const reviewsWithNames = data?.map((r) => ({
    ...r,
    user_name: profileMap.get(r.user_id) || 'Student',
  }));

  // Calculate aggregate rating
  let averageRating = 0;
  let ratingCount = 0;
  if (data && data.length) {
    ratingCount = data.length;
    const sum = data.reduce((acc, r) => acc + (r.rating || 0), 0);
    averageRating = Math.round((sum / data.length) * 10) / 10;
  }

  return NextResponse.json({
    reviews: reviewsWithNames,
    averageRating,
    ratingCount,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId } = await params;
  const body = await req.json();
  const { rating, title, text } = body;

  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5' },
      { status: 400 }
    );
  }

  const { data, error }: any = await supabase
    .from('course_reviews')
    .upsert(
      {
        course_id: courseId,
        user_id: user.id,
        rating: ratingNum,
        title: title || null,
        body: text || body || null,
      },
      { onConflict: 'course_id,user_id' }
    )
    .select()
    .single();

  if (error) {
    logger.error('course_reviews upsert error', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, review: data });
}
