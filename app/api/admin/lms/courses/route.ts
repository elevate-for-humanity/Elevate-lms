
/**
 * POST /api/admin/lms/courses — create a canonical draft course
 *
 * Writes to: courses → course_modules → course_lessons via course-service.ts.
 * This is the ONLY route that creates new courses. Legacy routes are disabled.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDraftCourse } from '@/lib/lms/course-service';
import { safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { slug, title, short_description, description, program_id, modules } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
    }

    const course = await createDraftCourse(supabase, {
      actorUserId:      user.id,
      programId:        program_id ?? undefined,
      slug,
      title,
      shortDescription: short_description ?? undefined,
      description:      description ?? undefined,
      modules:          modules ?? [],
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to create course');
  }
}
