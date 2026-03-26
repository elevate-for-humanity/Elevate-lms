import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
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

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: enrollments, error } = await supabase
      .from('training_enrollments')
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
      `
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ enrollments });
  } catch (error) { 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('training_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('training_enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: 'active',
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) { 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/enrollments', _GET);
export const POST = withApiAudit('/api/enrollments', _POST);
