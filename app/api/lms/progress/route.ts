export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Server-side progress fetch — bypasses RLS recursion on partner_users
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get('courseId');
  const admin = createAdminClient();
  const db = admin || supabase;

  if (courseId) {
    // Get progress for all lessons in a course
    const { data: lessons } = await db
      .from('training_lessons')
      .select('id')
      .eq('course_id', courseId);

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ progress: [] });
    }

    const lessonIds = lessons.map((l: any) => l.id);
    const { data: progress } = await db
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds);

    return NextResponse.json({ progress: progress || [] });
  }

  // Get all progress for user
  const { data: progress } = await db
    .from('lesson_progress')
    .select('id, completed_at, lesson:training_lessons(title, course_id)')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ progress: progress || [] });
}
