import { safeInternalError } from '@/lib/api/safe-error';
import { NextResponse } from 'next/server';

import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs'; // Changed from 'edge' to support email sending
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: enrollments, error } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        user_id,
        course_id,
        status,
        progress,
        started_at,
        completed_at,
        courses (
          id,
          title,
          description,
          duration_hours
        )
      `,
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      return safeInternalError(error as Error, 'Internal server error');
    }

    return NextResponse.json({ enrollments });
  } catch (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }
}

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('program_enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: 'active',
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      return safeInternalError(error as Error, 'Internal server error');
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }
}
export const GET = withApiAudit('/api/enrollments', _GET);
export const POST = withApiAudit('/api/enrollments', _POST);
