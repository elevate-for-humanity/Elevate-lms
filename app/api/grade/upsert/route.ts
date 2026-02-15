
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is instructor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const gradingRoles = ['instructor', 'admin', 'super_admin', 'staff'];
  if (!profile?.role || !gradingRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { gradeItemId, enrollmentId, points } = await req.json();

  if (
    !gradeItemId ||
    !enrollmentId ||
    points === undefined ||
    points === null
  ) {
    return NextResponse.json(
      { error: 'gradeItemId, enrollmentId, and points are required' },
      { status: 400 }
    );
  }

  // Verify this grade item belongs to a course taught by instructor
  const { data: gradeItem } = await supabase
    .from('grade_items')
    .select(
      `
      id,
      courses:course_id (
        instructor_id
      )
    `
    )
    .eq('id', gradeItemId)
    .single();

  if (!gradeItem || (gradeItem.courses as string)?.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Upsert the grade
  const { error } = await supabase.from('grades').upsert(
    {
      grade_item_id: gradeItemId,
      enrollment_id: enrollmentId,
      points,
      graded_at: new Date().toISOString(),
    },
    {
      onConflict: 'grade_item_id,enrollment_id',
    }
  );

  if (error) {
    logger.error('Failed to upsert grade:', error);
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
