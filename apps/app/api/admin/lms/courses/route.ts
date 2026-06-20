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
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — list canonical courses for Dev Studio / AI course builder sidebar */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, slug, status')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) return safeInternalError(error, 'Failed to list courses');
    return NextResponse.json({ courses: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Failed to list courses');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { slug, title, short_description, description, program_id, modules } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
    }

    const course = await createDraftCourse(supabase, {
      actorUserId: user.id,
      programId: program_id ?? undefined,
      slug,
      title,
      shortDescription: short_description ?? undefined,
      description: description ?? undefined,
      modules: modules ?? [],
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to create course');
  }
}
