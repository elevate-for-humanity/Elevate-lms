export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Returns the current user's enrollment status for a course.
 * Uses admin client to bypass RLS (training_enrollments has no student SELECT policy).
 */
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const db = admin || supabase;

  const { data: enrollment } = await db
    .from('training_enrollments')
    .select('id, status, progress, approved_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  return NextResponse.json({
    enrolled: !!enrollment,
    status: enrollment?.status || null,
    progress: enrollment?.progress || 0,
    approved: !!enrollment?.approved_at,
  });
}
